import { ColumnDefn, NameAnd, toColumns } from "@db-auto/utils";
import { CleanEnvironment, Environment } from "./environments";


const envColumnData: NameAnd<ColumnDefn<CleanEnvironment>> = {
  "Environment": { dataFn: ( t: CleanEnvironment, ) => t.name },
  "Type": { dataFn: ( t: CleanEnvironment ) => t.type },
  "UserName": { dataFn: ( t: CleanEnvironment ) => t.username },
  "Url": { dataFn: ( t: CleanEnvironment ) => t.url },
}

export function prettyPrintEnvironments ( envs: NameAnd<CleanEnvironment> ) {
  return toColumns ( envColumnData ) ( Object.values ( envs ) )

}