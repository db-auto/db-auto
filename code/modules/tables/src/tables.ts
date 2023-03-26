import { composeNameAndValidators, mapObject, NameAnd, NameAndValidator, orValidators, validateChild, validateChildItemOrArray, validateChildString, validateChildValue, validateItemOrArray, validateNameAnd, validateOrString, validateString, validateValue } from "@db-auto/utils";
import Require = NodeJS.Require;

export type Query = ColumnDataObj
export interface ColumnDataObj {
  name?: string,
  description?: string,
  type?: 'string' | 'number' | string; //default to string. 'string' and 'number' are defined in the dal
}
export type ColumnData = string | ColumnDataObj

export type CleanColumnData = Required<ColumnDataObj>

export interface Table {
  table?: string,
  primary?: Key,
  fk?: Key | Key[],

  views?: NameAnd<View | View[]>,
  links?: NameAnd<Link>,
  dataColumns?: NameAnd<ColumnDataObj>,
  queries?: NameAnd<Query>
}


export type LinkType = "one-to-many" | "many-to-one"
export type Link = HereAndThereLink | HereLinkAndThereLink

export function idHere ( link: Link ): string {
  if ( isHereAndThereLink ( link ) ) return link.idHereAndThere
  if ( isHereLinkAndThereLink ( link ) ) return link.idHere
}

export function idThere ( link: Link ): string {
  if ( isHereAndThereLink ( link ) ) return link.idHereAndThere
  if ( isHereLinkAndThereLink ( link ) ) return link.idThere
}
export function toCleanLink ( link: Link, defaultTable: string ): CleanLink {
  const table = link.table || defaultTable
  if ( isHereAndThereLink ( link ) ) return { type: link.type, idHere: link.idHereAndThere, idThere: link.idHereAndThere, table }
  return { table, ...link }
}
export interface HereAndThereLink {
  type: LinkType,
  idHereAndThere: string,
  table?: string
}
export function isHereAndThereLink ( link: Link ): link is HereAndThereLink {
  return (link as any).idHereAndThere !== undefined
}


export interface HereLinkAndThereLink {
  type: LinkType,
  idHere: string,
  idThere: string,
  table?: string
}
export type CleanLink = Required<HereLinkAndThereLink>

export function isHereLinkAndThereLink ( link: Link ): link is HereLinkAndThereLink {
  return (link as any).idHere !== undefined
}
export type View = string
export interface KeyData extends ColumnDataObj {
  name: string
}
export type Key = KeyData | string
export function nameOfKey ( k: Key ): string {
  let result = typeof k === 'string' ? k : k.name;
  return result;
}

export const keyValidator: NameAndValidator<Key> = composeNameAndValidators<Key> (
  validateOrString ( validateChildString<KeyData, 'name'> ( 'name', true ) ),
  validateOrString ( validateChildValue<KeyData, 'type'> ( 'type', 'integer', 'string' ) ) );


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

