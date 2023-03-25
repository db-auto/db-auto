import { composeNameAndValidators, NameAnd, NameAndValidator, validateChild, validateChildDefined, validateNameAnd } from "@db-auto/utils";
import { CleanTable, createCleanTables, Table, tableValidator } from "@db-auto/tables";
import { CleanEnvironment, cleanEnvironment, Environment, environmentValidator } from "@db-auto/environments";

export interface Config {
  environments: NameAnd<Environment>,
  tables: NameAnd<Table>
}
export interface CleanConfig {
  environments: NameAnd<CleanEnvironment>,
  tables: NameAnd<CleanTable>
}


export function cleanConfig ( envVars: NameAnd<string>, config: Config ): CleanConfig {
  return {
    environments: cleanEnvironment ( envVars, config.environments ),
    tables: createCleanTables ( config.tables )
  }
}

export const envValidator: NameAndValidator<Config> = composeNameAndValidators (
  validateChildDefined ( 'environments' ),
  validateChild ( 'environments', validateNameAnd ( environmentValidator ) ),
  validateChildDefined ( 'tables' ),
  validateChild ( 'tables', validateNameAnd ( tableValidator ) )
)
