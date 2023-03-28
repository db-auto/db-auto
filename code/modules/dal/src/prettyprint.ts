import { DalResult, DalRow } from "./dal";
import { ColumnDefn, fromEntries, NameAnd, safeToString, toColumns } from "@dbpath/utils";

export interface DalResultDisplayOptions {
  json?: boolean,
  onelinejson?: boolean
  notitles?: boolean

}

export function columnDefnFor ( res: DalResult ): NameAnd<ColumnDefn<DalRow>> {
  return fromEntries ( ...res.meta.columns.map<[ string, ColumnDefn<DalRow> ]> ( ( { name: title }, i ) => [ title, {
    title,
    dataFn: ( row ) => safeToString ( row[ title ] )
  } ] ) )
}

export function prettyPrintDalResult ( options: DalResultDisplayOptions, res: DalResult ): string[] {
  if ( options.json ) return [ JSON.stringify ( res.rows, null, 2 ) ]
  if ( options.onelinejson ) return res.rows.map ( row => JSON.stringify ( row ) )
  return toColumns ( columnDefnFor ( res ), !options.notitles ) ( res.rows )
}
