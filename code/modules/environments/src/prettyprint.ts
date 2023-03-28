import { ColumnDefn, NameAnd, toColumns } from "@dbpath/utils";
import { CleanEnvironment, Environment } from "./environments";


const envColumnData: NameAnd<ColumnDefn<CleanEnvironment>> = {
  "Environment": { dataFn: ( t: CleanEnvironment, ) => t.name },
  "Type": { dataFn: ( t: CleanEnvironment ) => t.type },
  "Host": { dataFn: ( t: CleanEnvironment ) => t.host },
  "Port": { dataFn: ( t: CleanEnvironment ) => t.port===undefined?'':t.port.toString () },
  "Database": { dataFn: ( t: CleanEnvironment ) => t.database },
  "UserName": { dataFn: ( t: CleanEnvironment ) => t.username },
}

export function prettyPrintEnvironments ( envs: NameAnd<CleanEnvironment> ) {
  return toColumns ( envColumnData ) ( Object.values ( envs ) )

}