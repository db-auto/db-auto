import { CleanColumnData, CleanTable } from "@dbpath/tables";
import { mapEntries, NameAnd } from "@dbpath/utils";


export function makeCreateTableSqlForColumns ( t: NameAnd<CleanColumnData> ) {
  return mapEntries ( t, ( data, name ) => name + " " + data.type )
}
export function makeCreateTableSqlForMock ( t: CleanTable ) {
  return "CREATE TABLE " + t.table + " ( " + makeCreateTableSqlForColumns ( t.columns ) + " );";
}