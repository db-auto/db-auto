import { ErrorsAnd, hasErrors, mapErrors, mapObject, NameAnd, NameAndValidator } from "@db-auto/utils";
import { postgresDal, postgresDalDialect, PostgresEnv, postgresEnvValidator } from "@db-auto/postgres";
import { findDirectoryHoldingFileOrError, findFileInParentsOrError } from "@db-auto/files";
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