import { composeNameAndValidators, mapObject, NameAnd, NameAndValidator, orValidators, validateChild, validateChildItemOrArray, validateChildString, validateChildValue, validateItemOrArray, validateNameAnd, validateString, validateValue } from "@db-auto/utils";

export interface Query{
  type: string,
  description?: string
}

export interface Table {
  table?: string,
  primary?: Key,
  fk?: Key | Key[],
  views?: NameAnd<View | View[]>,
  links?: NameAnd<Link>,

  queries?: NameAnd<Query>
}

export type LinkType = "one-to-many" | "many-to-one"
export type Link = HereAndThereLink | HereLinkAndThereLink
export interface HereAndThereLink {
  type: LinkType,
  idHereAndThere: string,
}
export interface HereLinkAndThereLink {
  type: LinkType,
  idHere: string,
  idThere: string,
}

export type View = string
export interface Key {
  name: string,
  type: "integer" | "string"
}
export interface Environment {
  type: "oracle" | "mysql",
  url: string,
  username?: string,
  password?: string
}

export const keyValidator: NameAndValidator<Key> = composeNameAndValidators<Key> (
  validateChildString ( 'name' , true),
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
  validateChildString ( 'table', true ),
  validateChild ( 'primary', keyValidator ),
  validateChildItemOrArray ( 'fk', keyValidator, true ),
  validateChildItemOrArray ( 'views', validateNameAnd ( validateItemOrArray ( validateString () ) ), true ),
  validateChild ( 'links', validateNameAnd ( linkValidator ), true ) )
export function cleanTable ( table: Table, defaultName: string ) {
  return { ...table, table: table.table ? table.table : defaultName };
}
export function cleanTables(tables: NameAnd<Table>): NameAnd<Table> {
  return mapObject(tables, cleanTable)
}
