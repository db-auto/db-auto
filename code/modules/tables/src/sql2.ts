import { isLinkInPath, PathItem } from "@dbpath/types";
import { MergedSelectData, mergeSelectData, SelectData, sqlFor, SqlOptions } from "./sql";


export const mapOverPath = <T> ( p: PathItem, fn: ( p: PathItem ) => T ): T[] =>
  isLinkInPath ( p ) ? [ ...mapOverPath ( p.previousLink, fn ), fn ( p ) ] : [ fn ( p ) ];


export function pathToSelectData ( p: PathItem ): SelectData[] {
  const parts: PathItem[] = mapOverPath ( p, p => p );
  return parts.map ( ( p, i ) => {
    let alias = `T${i}`;
    const selectDataForTable: SelectData = {
      columns: p.fields.length > 0 ? p.fields : [ '*' ],
      table: p.table,
      alias,
      where: isLinkInPath ( p ) ? p.idEquals.map ( ( { fromId, toId } ) =>
        `T${i - 1}.${fromId}=${alias}.${toId}` ) : []
    }
    return selectDataForTable
  } )
}

export function pathToSql ( sqlOptions: SqlOptions, p: PathItem ): string[] {
  return sqlFor ( sqlOptions ) ( mergeSelectData ( pathToSelectData ( p ) ) )
}