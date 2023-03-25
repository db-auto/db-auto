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
export function toHereLinkAndThereLink(link:Link):HereLinkAndThereLink{
  if(isHereAndThereLink(link)) return { type: link.type, idHere: link.idHereAndThere, idThere: link.idHereAndThere }
  return link
}
export interface HereAndThereLink {
  type: LinkType,
  idHereAndThere: string,
}
export function isHereAndThereLink ( link: Link ): link is HereAndThereLink {
  return (link as any).idHereAndThere !== undefined
}


export interface HereLinkAndThereLink {
  type: LinkType,
  idHere: string,
  idThere: string,
}

export function isHereLinkAndThereLink ( link: Link ): link is HereLinkAndThereLink {
  return (link as any).idHere !== undefined
}
export type View = string
export interface KeyData extends ColumnDataObj {
  name: string
}
export type Key = KeyData | string
export  function nameOfKey(k:Key):string{
  if(typeof k === 'string') return k
  return k.name
}
export interface Environment {
  type: "oracle" | "mysql",
  url: string,
  username?: string,
  password?: string
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

