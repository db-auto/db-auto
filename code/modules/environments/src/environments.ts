import { ColumnDefn, ErrorsAnd, hasErrors, mapErrors, mapObject, NameAnd, NameAndValidator } from "@dbpath/utils";
import { postgresDal, postgresDalDialect, PostgresEnv, postgresEnvValidator } from "@dbpath/postgres";
import { findDirectoryHoldingFileOrError, findFileInParentsOrError } from "@dbpath/files";
import * as Path from "path";
import * as fs from "fs";


export type Environment = PostgresEnv

export interface CurrentEnvironment {
  currentEnvironment: string
}

const stateFileName = '.db-auto.state.json';
export function currentEnvName ( cwd: string, env: string | undefined ): ErrorsAnd<string> {
  if ( env ) return env
  const dir = findDirectoryHoldingFileOrError ( cwd, 'db-auto.json' )
  if ( hasErrors ( dir ) ) return dir
  const envFile = Path.join ( dir, stateFileName )
  try {
    const contents = fs.readFileSync ( envFile ).toString ( 'utf-8' )
    try {
      return JSON.parse ( contents ).currentEnvironment
    } catch ( e ) {
      return [ `Error parsing ${envFile}: ${e.message}` ]
    }
  } catch ( e ) {
    return 'dev'
  }
}

export function saveEnvName ( cwd: string, env: string ): ErrorsAnd<void> {
  const dir = findDirectoryHoldingFileOrError ( cwd, 'db-auto.json' )
  if ( hasErrors ( dir ) ) return dir
  const envFile = Path.join ( dir, stateFileName )
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
export function currentEnvironment ( cwd: string, envs: NameAnd<CleanEnvironment>, env: string | undefined ): ErrorsAnd<EnvAndName> {
  return mapErrors ( currentEnvName ( cwd, env ), ( envName ) => {
    const env = envs[ envName ]
    if ( env ) return { env, envName }
    return [ `Environment ${envName} not found. Legal names are ${Object.keys ( envs ).sort ()}` ]
  } );
}
export interface CleanEnvironment extends Required<Environment> {
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
    username: orDefault ( envName, envVars, env.username, 'username' ),
    password: orDefault ( envName, envVars, env.password, 'password' ),
  }) )
}

export const environmentValidator: NameAndValidator<Environment> = name => env => {
  if ( env.type === 'postgres' ) return postgresEnvValidator ( name ) ( env )
  return [ `Unknown environment type ${env.type}. Currently on postgres is supported. ${JSON.stringify ( env )}` ]
}


export function sqlDialect ( type: string ) {
  if ( type === 'postgres' ) return postgresDalDialect
  throw new Error ( `Unknown environment type ${type}. Currently on postgres is supported. ${JSON.stringify ( type )}` )
}
export function dalFor ( env: Environment ) {
  if ( env.type === 'postgres' ) return postgresDal ( env )
  throw new Error ( `Unknown environment type ${env.type}. Currently on postgres is supported. ${JSON.stringify ( env )}` )
}

export interface EnvStatus {
  name: string
  up: boolean
  env: CleanEnvironment
}
//TODO do in parallel
export async function envIsUp ( env: CleanEnvironment ): Promise<boolean> {
  let dal = dalFor ( env );
  try {
    const dialect = sqlDialect ( env.type );
    await dal.query ( dialect.safeQuery );
    return true
  } catch ( e ) {
    return false
  } finally {
    await dal.close ();
  }
}

export async function checkStatus ( envs: NameAnd<CleanEnvironment> ): Promise<NameAnd<EnvStatus>> {
  let result: NameAnd<EnvStatus> = {}
  for ( const [ name, env ] of Object.entries ( envs ) )
    result[ name ] = { name, env, up: await envIsUp ( env ) }
  return result;
}

export const statusColDefn: NameAnd<ColumnDefn<EnvStatus>> = {
  "Environment": { dataFn: ( t: EnvStatus, ) => t.name },
  "Type": { dataFn: ( t: EnvStatus ) => t.env.type },
  "Host": { dataFn: ( t: EnvStatus ) => t.env.host },
  "Port": { dataFn: ( t: EnvStatus ) => t.env.port === undefined ? '' : t.env.port.toString () },
  "Database": { dataFn: ( t: EnvStatus ) => t.env.database },
  "UserName": { dataFn: ( t: EnvStatus ) => t.env.username },
  "Up": { dataFn: ( t: EnvStatus ) => t.up.toString () },
}