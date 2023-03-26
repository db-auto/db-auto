import { DalResult, DalRow } from "./dal";
import { ColumnDefn, fromEntries, NameAnd, safeToString, toColumns } from "@db-auto/utils";


export function columnDefnFor ( res: DalResult ): NameAnd<ColumnDefn<DalRow>> {
  return fromEntries ( ...res.meta.columns.map<[ string, ColumnDefn<DalRow> ]> ( ( { name: title }, i ) => [ title, {
    title,
    dataFn: ( row ) => safeToString ( row[ title ] )
  } ] ) )
}

export function prettyPrintDalResult ( res: DalResult, showTitles?: false ): string[] {
  return toColumns ( columnDefnFor ( res ), showTitles ) ( res.rows )
}
