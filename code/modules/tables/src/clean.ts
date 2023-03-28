import { fromEntries, mapObject, NameAnd, safeObject, toArray } from "@dbpath/utils";
import { CleanColumnData, CleanLink, ColumnDataObj, HereLinkAndThereLink, Key, Link, nameOfKey, Query, Table, toCleanLink } from "./tables";
import Require = NodeJS.Require;


export interface CleanTable {

  table: string,
  primary: string | undefined, // index into keys
  keys: NameAnd<CleanColumnData>,
  columns: NameAnd<CleanColumnData>
  views: NameAnd<string[]>
  queries: NameAnd<Required<Query>>
  links: NameAnd<CleanLink>

}

export function mapToNameAndColumnData ( n: NameAnd<ColumnDataObj> ): NameAnd<CleanColumnData> {
  return mapObject<ColumnDataObj, CleanColumnData> ( safeObject ( n ), ( dataColumn, name ) =>
    ({ name, type: 'string', description: "", ...dataColumn }) );
}

export function nameAndCleanColumnDataFromKey ( k: Key ): [ string, CleanColumnData ] {
  const def = { type: 'number', description: "" }
  if ( typeof k === 'string' ) return [ k, { ...def, name: k } ]
  return [ k.name, { ...def, ...k } ]
}
export function columnDataFor ( t: Table ) {
  var fromDataColumns: NameAnd<CleanColumnData> = mapToNameAndColumnData ( t.dataColumns );
  var fromPK: NameAnd<CleanColumnData> = t.primary ? fromEntries ( nameAndCleanColumnDataFromKey ( t.primary ) ) : {}
  var fromFK: NameAnd<CleanColumnData> = fromEntries<CleanColumnData> ( ...(toArray ( t.fk ).map <[ string, CleanColumnData ]> ( fk => nameAndCleanColumnDataFromKey ( fk ) )) )
  return { fromFK, fromPK, fromDataColumns }

}
export function createCleanTable ( table: Table, name: string ): CleanTable {
  const columnData = columnDataFor ( table )
  const { fromFK, fromPK, fromDataColumns } = columnData
  const columns = { ...fromFK, ...fromPK, ...fromDataColumns }
  const keys = { ...fromFK, ...fromPK }
  const primary = nameOfKey ( table.primary )
  const tableName = table.table || name
  let views = mapObject ( table.views, v => toArray ( v ) );
  const queries = mapObject ( safeObject ( table.queries ), q => ({ name: "", description: "", type: "string", ...q }) )
  const links = mapObject ( safeObject ( table.links ), toCleanLink )
  return ({
    table: tableName,
    columns,
    primary,
    keys,
    views,
    queries,
    links
  })
}

export function createCleanTables ( tables: NameAnd<Table> ): NameAnd<CleanTable> {
  return mapObject ( tables, createCleanTable )

}
