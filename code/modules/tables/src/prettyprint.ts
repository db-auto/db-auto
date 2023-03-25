import { CleanTable } from "./clean";
import { ColumnDefn, mapEntries, NameAnd, toColumns } from "@db-auto/utils";

const tableColumnDefn: NameAnd<ColumnDefn<CleanTable>> = {
  "table": { title: "Table", dataFn: ( t: CleanTable ) => t.table },
  "links": { title: "Links", dataFn: ( t: CleanTable ) => mapEntries ( t.links, ( l, name ) => name ).join ( ',' ) },
  "views": { title: "Views", dataFn: ( t: CleanTable ) => mapEntries ( t.views, ( v, name ) => name ).join ( ',' ) }
}

export function prettyPrintTables ( tables: NameAnd<CleanTable> ) {
  return toColumns ( tableColumnDefn ) ( Object.values ( tables ) )

}