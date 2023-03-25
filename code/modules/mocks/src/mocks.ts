import { CleanColumnData, CleanTable } from "@db-auto/tables";
import { mapEntries, NameAnd } from "@db-auto/utils";


export function makeCreateTableSqlForColumns ( t: NameAnd<CleanColumnData> ) {
  return mapEntries ( t, ( data, name ) => name + " " + data.type )
}
export function makeCreateTableSqlForMock ( t: CleanTable ) {
  return "CREATE TABLE " + t.table + " ( " + makeCreateTableSqlForColumns ( t.columns ) + " );";
}