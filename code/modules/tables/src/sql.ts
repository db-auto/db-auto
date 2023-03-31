import { isLinkInPath, isTableInPath, PathItem, TableInPath } from "@dbpath/types";
import { mergeSelectData, SelectData, sqlFor, SqlOptions } from "./selectData";
import { PathSpecForWheres, quoteIfNeeded } from "./pathSpec";
import { NameAndType } from "@dbpath/dal";
import { safeArray } from "@dbpath/utils";


export const mapOverPath = <T> ( p: PathItem, fn: ( p: PathItem ) => T ): T[] =>
  isLinkInPath ( p ) ? [ ...mapOverPath ( p.previousLink, fn ), fn ( p ) ] : [ fn ( p ) ];


function makePkWhere ( pathSpecForWhere: PathSpecForWheres, p: TableInPath, alias: string ) {
  const pks: NameAndType[] = pathSpecForWhere.table2Pk[ p.table ].pk
  return pks.map ( pk => `${alias}.${pk.name}=${quoteIfNeeded ( pk.type, pathSpecForWhere.id )}` );
}
export function pathToSelectData ( p: PathItem, pathSpecForWhere: PathSpecForWheres ): SelectData[] {
  const parts: PathItem[] = mapOverPath ( p, p => p );
  return parts.map ( ( p, i ) => {
    let alias = `T${i}`;
    let TableWheres = pathSpecForWhere.id && isTableInPath ( p ) ? makePkWhere ( pathSpecForWhere, p, alias ) : []
    let pathWheres = isTableInPath ( p ) ? safeArray ( pathSpecForWhere.wheres ) : []
    let linkWheres = isLinkInPath ( p ) ? p.idEquals.map ( ( { fromId, toId } ) =>
      `T${i - 1}.${fromId} = ${alias}.${toId}` ) : [];
    const selectDataForTable: SelectData = {
      columns: p.fields.length > 0 ? p.fields : [ '*' ],
      table: p.table,
      alias,
      where: [ ...linkWheres, ...TableWheres, ...pathWheres ]
    }
    return selectDataForTable
  } )
}


function pathToMergedData ( p: PathItem, pathSpec: PathSpecForWheres ) {
  return mergeSelectData ( pathToSelectData ( p, pathSpec ) );
}
export function pathToSql ( sqlOptions: SqlOptions, p: PathItem, pathSpec: PathSpecForWheres ): string[] {
  return sqlFor ( sqlOptions ) ( pathToMergedData ( p, pathSpec ) )
}

