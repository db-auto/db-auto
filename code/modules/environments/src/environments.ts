import { ErrorsAnd, hasErrors, mapErrors, mapObject, NameAnd, NameAndValidator, validate } from "@dbpath/utils";
import { postgresDal, postgresDalDialect, PostgresEnv, postgresEnvValidator } from "@dbpath/postgres";
import { findDirectoryHoldingFileOrError, loadFileInDirectory } from "@dbpath/files";
import * as Path from "path";
import * as fs from "fs";
import { CommonEnvironment, Dal } from "@dbpath/dal";
import { oracleDal, oracleDalDialect, OracleEnv, oracleEnvValidator } from "@dbpath/oracle";

export const dbPathDir = '.dbpath';


export type Environment = PostgresEnv | OracleEnv


export const stateFileName = 'dbpath.state.json';
export function currentEnvName ( cwd: string, marker: string, env: string | undefined, cleanE: NameAnd<CleanEnvironment> ): ErrorsAnd<string> {
  if ( env ) return env
  const contents = loadFileInDirectory ( cwd, 'environments', marker, stateFileName )
  if ( hasErrors ( contents ) ) return 'dev'
  const foundEnv = contents.currentEnvironment
  if ( cleanE[ foundEnv ] ) return foundEnv
  return [ `Environment ${foundEnv} not found. Legal values are ${Object.keys ( cleanE ).sort ().join ( ', ' )}` ]
}

export function saveEnvName ( cwd: string, marker: string, env: string ): ErrorsAnd<void> {
  const dir = findDirectoryHoldingFileOrError ( cwd, marker )
  if ( hasErrors ( dir ) ) return dir
  const envFile = Path.join ( dir, marker, stateFileName )
  try {
    fs.writeFileSync ( envFile, JSON.stringify ( { currentEnvironment: env } ) )
    return undefined
  } catch ( e ) {
    return [ `Error writing ${envFile}: ${e.message}` ]
  }
}

export interface EnvAndName {
  env: CleanEnvironment
  envName: string
}
export function currentEnvironment ( cwd: string, marker: string, envs: NameAnd<CleanEnvironment>, env: string | undefined ): ErrorsAnd<EnvAndName> {
  return mapErrors ( currentEnvName ( cwd, marker, env, envs ), ( envName ) => {
    const env = envs[ envName ]
    if ( env ) {
      const errors = environmentValidator ( envName ) ( env as any )
      if ( errors.length > 0 ) return [ `Errors loading environment details`, ...errors, 'You need to edit the config file before you can use this environment' ]
      return { env, envName }
    }
    return [ `Environment ${envName} not found. Legal names are ${Object.keys ( envs ).sort ()}` ]
  } );
}
export interface DalAndEnv extends EnvAndName {
  dal: Dal
}
export async function dalFromCurrentEnvironment ( cwd: string, envs: NameAnd<CleanEnvironment>, specifiedEnv: string | undefined ): Promise<ErrorsAnd<DalAndEnv>> {
  const envAndNameOrErrors = currentEnvironment ( cwd, dbPathDir, envs, specifiedEnv )
  if ( hasErrors ( envAndNameOrErrors ) ) return envAndNameOrErrors
  const { env, envName } = envAndNameOrErrors
  return mapErrors ( await dalFor ( env ), dal => ({ dal, ...envAndNameOrErrors }) )
}

export async function useDalAndEnv<T> ( cwd: string, envs: NameAnd<CleanEnvironment>, specifiedEnv: string | undefined, fn: ( dalAndEnv: DalAndEnv ) => Promise<ErrorsAnd<T>> ): Promise<ErrorsAnd<T>> {
  const errorsOrDal: ErrorsAnd<DalAndEnv> = await dalFromCurrentEnvironment ( cwd, envs, specifiedEnv )
  if ( hasErrors ( errorsOrDal ) ) return errorsOrDal
  try {
    return await fn ( errorsOrDal )
  } finally {
    errorsOrDal.dal.close ()
  }
}


export interface CleanEnvironment extends Required<CommonEnvironment> {
  name: string
}


function orDefault ( mainName: string, envVars: NameAnd<string>, value: string | undefined, name: string ): string {
  if ( value !== undefined ) return value;
  const fromVar = envVars[ `DB_AUTO_${mainName}_${name}`.toUpperCase () ];
  if ( fromVar !== undefined ) return fromVar;
  return ""
}

export function cleanEnvironment ( envVars: NameAnd<string>, env: NameAnd<Environment> ): NameAnd<CleanEnvironment> {
  return mapObject ( env, ( env, envName ) => ({
    name: envName,
    ...env,
    schema: env.schema,
    username: orDefault ( envName, envVars, env.username, 'username' ),
    password: orDefault ( envName, envVars, env.password, 'password' ),
  }) )
}

export const environmentValidator: NameAndValidator<Environment> = name => env => {
  if ( env.type === 'postgres' ) return postgresEnvValidator ( name ) ( env as PostgresEnv )
  if ( env.type === 'oracle' ) return oracleEnvValidator ( name ) ( env as OracleEnv )
  return [ `Unknown environment type ${env.type}. Currently only postgres and oracle are supported. ${JSON.stringify ( env )}` ]
}


export function sqlDialect ( type: string ) {
  if ( type === 'postgres' ) return postgresDalDialect
  if ( type === 'oracle' ) return oracleDalDialect
  throw new Error ( `Unknown environment type ${type}. Currently on postgres is supported. ${JSON.stringify ( type )}` )
}
export async function dalFor ( env: CommonEnvironment ): Promise<ErrorsAnd<Dal>> {
  try {
    if ( env.type === 'postgres' ) return await postgresDal ( env as PostgresEnv )
    if ( env.type === 'oracle' ) return await oracleDal ( env as OracleEnv )
  } catch ( e ) {
    return [ `Could not get a dal for ${env.type}. Is it up? try 'dbpath admin status'`, e.message ]
  }
  throw new Error ( `Unknown environment type ${env.type}. Currently on postgres is supported. ${JSON.stringify ( env )}` )
}

export interface EnvStatus {
  name: string
  up: boolean
  env: CleanEnvironment
}
//TODO do in parallel
export async function envIsUp ( env: CleanEnvironment ): Promise<boolean> {
  try {
    let dal = await dalFor ( env );
    if ( hasErrors ( dal ) ) return false
    try {
      const dialect = sqlDialect ( env.type );
      await dal.query ( dialect.safeQuery );
      return true
    } finally {
      await dal.close ();
    }
  } catch ( e ) {
    return false
  }
}

export async function checkStatus ( envs: NameAnd<CleanEnvironment> ): Promise<NameAnd<EnvStatus>> {
  let result: NameAnd<EnvStatus> = {}
  for ( const [ name, env ] of Object.entries ( envs ) )
    result[ name ] = { name, env, up: await envIsUp ( env ) }
  return result;
}

export function mapEnv<T> ( e: CommonEnvironment, postGes: ( e: PostgresEnv ) => T, oracleFn: ( e: OracleEnv ) => T ) {
  if ( e.type === 'postgres' ) return postGes ( e as PostgresEnv )
  if ( e.type === 'oracle' ) return oracleFn ( e as OracleEnv )
  throw new Error ( `Unknown environment type ${e.type}. Currently on postgres is supported. ${JSON.stringify ( e )}` )
}

