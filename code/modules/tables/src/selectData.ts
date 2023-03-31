import { flatMap } from "@dbpath/utils";


export interface SelectData {
  table: string,
  alias: string,
  columns: string[],
  where: string[],
}


export interface MergedSelectData {
  tables: { table: string, alias: string }[]
  columns: { alias: string, column: string }[],
  where: string[]
}
export function mergeSelectData ( selectData: SelectData[] ): MergedSelectData {
  const tables = selectData.map ( s => ({ table: s.table, alias: s.alias }) )
  const columns = flatMap ( selectData, s => s.columns.map ( c => ({ alias: s.alias, column: c }) ) )
  const where = flatMap ( selectData, s => s.where ).filter ( w => w !== undefined )
  return { tables, columns, where }

}

export interface SqlOptions {
  page?: number,
  pageSize?: number,
  distinct?: boolean,
  count?: boolean,
  limitBy?: ( pageNum: number, pageSize: number, s: string[] ) => string[]
}

export const sqlFor = ( s: SqlOptions ) => ( m: MergedSelectData ): string[] => {
  const { page, pageSize, distinct, count, limitBy } = s;
  const distinctClause = distinct ? 'distinct ' : '';
  const columns = count ? 'count(1)' : m.columns.map ( c => `${c.alias}.${c.column}` ).join ( ', ' )
  const tables = m.tables.map ( t => `${t.table} ${t.alias}` ).join ( ', ' )
  const where = m.where.length > 0 ? `where ${m.where.join ( ' and ' )}` : ''
  let result = [ `select ${distinctClause}${columns}`, `   from ${tables} ${where}`.trimRight () ];
  if ( limitBy && page !== undefined && pageSize !== undefined ) return limitBy ( page, pageSize, result )
  return result
};