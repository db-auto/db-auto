import { flatMap, safeArray } from "@dbpath/utils";
import { Paging } from "@dbpath/types";


export interface SelectData {
  schema: string
  table: string,
  pk: string[],
  alias: string,
  columns: string[],
  where: string[],
}


export interface MergedSelectData {
  tables: { schema: string,table: string, alias: string }[]
  columns: { alias: string, column: string }[],
  where: string[],
  pk: string[]
}
export function mergeSelectData ( selectData: SelectData[] ): MergedSelectData {
  const tables = selectData.map ( s => ({schema: s.schema, table: s.table, alias: s.alias }) )
  const columns = flatMap ( selectData, s => s.columns.map ( c => ({ alias: s.alias, column: c }) ) )
  const where = flatMap ( selectData, s => s.where ).filter ( w => w !== undefined )
  const pk = selectData.length === 0 ? [] : [ selectData[ 0 ].pk.map ( pk => `${tables[ 0 ].alias}.${pk}` ).join ( ',' ) ]
  return { tables, columns, where, pk }

}


export interface SqlOptions  extends Paging{
  distinct?: boolean,
  count?: boolean,
  limitBy?: ( pageNum: number, pageSize: number, s: string[] ) => string[]
}

export const sqlFor = ( s: SqlOptions ) => ( m: MergedSelectData ): string[] => {
  const { page, pageSize, distinct, count, limitBy } = s;
  const distinctClause = distinct ? 'distinct ' : '';
  const columns = count ? 'count(1)' : m.columns.map ( c => `${c.alias}.${c.column}` ).join ( ', ' )
  const tables = m.tables.map ( t => `${t.schema}.${t.table} ${t.alias}` ).join ( ', ' )
  const where = m.where.length > 0 ? `where ${m.where.join ( ' and ' )}` : ''
  let orderBy = count ? [] : [ `order by ${safeArray ( m.pk ).join ( ', ' )}` ];
  let result = [ `select ${distinctClause}${columns}`, `   from ${tables} ${where}`.trimRight (), ...orderBy ];
  if ( limitBy && page !== undefined && pageSize !== undefined && !count ) return limitBy ( page, pageSize, result )
  return result
};