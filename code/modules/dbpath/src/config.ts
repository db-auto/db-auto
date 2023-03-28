import { composeNameAndValidators, NameAnd, NameAndValidator, validateChild, validateChildDefined, validateNameAnd } from "@dbpath/utils";
import { CleanTable, createCleanTables, Table, tableValidator } from "@dbpath/tables";
import { CleanEnvironment, cleanEnvironment, Environment, environmentValidator } from "@dbpath/environments";

export interface Config {
  environments: NameAnd<Environment>,
  tables: NameAnd<Table>
}
export interface CleanConfig {
  environments: NameAnd<CleanEnvironment>,
  tables: NameAnd<CleanTable>
}


export const cleanConfig = ( envVars: NameAnd<string>) =>( config: Config ): CleanConfig => ({
  environments: cleanEnvironment ( envVars, config.environments ),
  tables: createCleanTables ( config.tables )
});

export const envValidator: NameAndValidator<Config> = composeNameAndValidators (
  validateChildDefined ( 'environments' ),
  validateChild ( 'environments', validateNameAnd ( environmentValidator ) ),
  validateChildDefined ( 'tables' ),
  validateChild ( 'tables', validateNameAnd ( tableValidator ) )
)
