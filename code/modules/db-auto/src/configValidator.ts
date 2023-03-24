import { Config, Environment, HereAndThereLink, HereLinkAndThereLink, Key, Link, LinkType, Table, View } from "./config";
import { composeNameAndValidators, NameAndValidator, orValidators, validateChild, validateChildString, validateChildStringOrUndefined, validateChildValue, validateItemOrArray, validateNameAnd, validateString, validateValue } from "@db-auto/utils";

export const x = 1
export const environmentValidator: NameAndValidator<Environment> = composeNameAndValidators<Environment> (
  validateChildValue ( 'type', 'oracle', 'mysql' ),
  validateChildString ( 'url' ),
  validateChildStringOrUndefined ( 'username' ),
  validateChildStringOrUndefined ( 'password' )
)

export const keyValidator: NameAndValidator<Key> = composeNameAndValidators<Key> (
  validateChildString ( 'name' ),
  validateChildValue ( 'type', 'integer', 'string' ) );


export const linkTypeValidator: NameAndValidator<LinkType> = validateValue<LinkType> ( 'one-to-many', 'many-to-one' )
export const hereAndThereLinkValidator: NameAndValidator<HereAndThereLink> = composeNameAndValidators (
  validateChild ( 'type', linkTypeValidator ),
  validateChildString ( 'idHereAndThere' )
)
export const hereLinkAndThereLinkValidator: NameAndValidator<HereLinkAndThereLink> = composeNameAndValidators (
  validateChild ( 'type', linkTypeValidator ),
  validateChildString ( 'idHere' ),
  validateChildString ( 'idThere' )
)
export const linkValidator: NameAndValidator<Link> = orValidators<Link> ( 'not a link', hereAndThereLinkValidator, hereLinkAndThereLinkValidator )
export const tableValidator: NameAndValidator<Table> = composeNameAndValidators<Table> (
  validateChildString ( 'table' ),
  validateChild ( 'primary', keyValidator ),
  validateItemOrArray ( 'fk', keyValidator ),
  validateItemOrArray ( 'views', validateString ),
  validateChild ( 'links', validateNameAnd ( linkValidator ) ) )
export const configValidator: NameAndValidator<Config> = composeNameAndValidators (
  validateChild ( 'environment', validateNameAnd ( environmentValidator ) ),
  validateChild ( 'tables', validateNameAnd ( tableValidator ) )
)




