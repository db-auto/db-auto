import { composeNameAndValidators, mapObject, NameAnd, NameAndValidator, validateChildString, validateChildValue } from "@db-auto/utils";

export interface Environment {
  type: "oracle" | "mysql" | "postgres",
  url: string,
  username?: string,
  password?: string
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

export const environmentValidator: NameAndValidator<Environment> = composeNameAndValidators<Environment> (
  validateChildValue ( 'type', 'oracle', 'mysql', 'postgres' ),
  validateChildString ( 'url' ),
  validateChildString ( 'username', true ),
  validateChildString ( 'password', true )
)
