import { Config } from "./config";
import { composeNameAndValidators, NameAndValidator, validateChild, validateChildDefined, validateChildString, validateChildValue, validateNameAnd } from "@db-auto/utils";
import { Environment, tableValidator } from "@db-auto/tables";


export const environmentValidator: NameAndValidator<Environment> = composeNameAndValidators<Environment> (
  validateChildValue ( 'type', 'oracle', 'mysql' ),
  validateChildString ( 'url' ),
  validateChildString ( 'username', true ),
  validateChildString ( 'password', true )
)

export const configValidator: NameAndValidator<Config> = composeNameAndValidators (
  validateChildDefined ( 'environments' ),
  validateChild ( 'environments', validateNameAnd ( environmentValidator ) ),
  validateChildDefined ( 'tables' ),
  validateChild ( 'tables', validateNameAnd ( tableValidator ) )
)




