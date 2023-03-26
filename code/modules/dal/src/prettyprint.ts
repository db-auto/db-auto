import { DalResult, DalRow } from "./dal";
import { ColumnDefn, fromEntries, NameAnd, safeToString, toColumns } from "@db-auto/utils";

export interface DalResultDisplayOptions {
  json?: boolean,
  onelinejson?: boolean

}

export function columnDefnFor ( res: DalResult ): NameAnd<ColumnDefn<DalRow>> {
  return fromEntries ( ...res.meta.columns.map<[ string, ColumnDefn<DalRow> ]> ( ( { name: title }, i ) => [ title, {
    title,
    dataFn: ( row ) => safeToString ( row[ title ] )
  } ] ) )
}

export function prettyPrintDalResult ( options: DalResultDisplayOptions, res: DalResult, showTitles?: false ): string[] {
  if ( options.json ) return [ JSON.stringify ( res.rows, null, 2 ) ]
  if ( options.onelinejson ) return res.rows.map ( row => JSON.stringify ( row ) )
  return toColumns ( columnDefnFor ( res ), showTitles ) ( res.rows )
}
