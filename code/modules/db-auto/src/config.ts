import { mapObject, NameAnd } from "@db-auto/utils";
import { createCleanTables, Environment, Table } from "@db-auto/tables";

export interface Config {
  environments: NameAnd<Environment>,
  tables: NameAnd<Table>
}

function orDefault ( mainName: string, envVars: NameAnd<string>, value: string | undefined, name: string ): string {
  return value === undefined ? envVars[ `${mainName}.${name}` ] : value;
}
function cleanEnvironment ( envVars: NameAnd<string>, env: NameAnd<Environment> ): NameAnd<Environment> {
  return mapObject ( env, ( env, envName ) => ({
    ...env,
    username: orDefault ( envName, envVars, env.username, 'username' ),
    password: orDefault ( envName, envVars, env.password, 'password' ),
  }) )
}

export function cleanConfig ( envVars: NameAnd<string>, config: Config ): Config {
  return {
    environments: cleanEnvironment ( envVars, config.environments ),
    tables: createCleanTables ( config.tables )
  }
}