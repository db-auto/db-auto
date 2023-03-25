import { CleanTable } from "./clean";
import { ColumnDefn, mapEntries, NameAnd, toColumns } from "@db-auto/utils";

const tableColumnDefn: NameAnd<ColumnDefn<[ string, CleanTable ]>> = {
  "name": { title: "Name", dataFn: ( t: [ string, CleanTable ] ) => t[ 0 ] },
  "table": { title: "Table", dataFn: ( t: [ string, CleanTable ] ) => t[ 1 ].table },
  "links": { title: "Links", dataFn: ( t: [ string, CleanTable ] ) => mapEntries ( t[ 1 ].links, ( l, name ) => name ).join ( ',' ) },
  "views": { title: "Views", dataFn: ( t: [ string, CleanTable ] ) => mapEntries ( t[ 1 ].views, ( v, name ) => name ).join ( ',' ) }
}

export function prettyPrintTables ( tables: NameAnd<CleanTable> ) {
  return toColumns ( tableColumnDefn ) ( Object.entries ( tables ) )

}