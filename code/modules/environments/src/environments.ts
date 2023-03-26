import { mapObject, NameAnd, NameAndValidator } from "@db-auto/utils";
import { postgresDal, postgresDalDialect, PostgresEnv, postgresEnvValidator } from "@db-auto/postgres";


export type Environment = PostgresEnv
{
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