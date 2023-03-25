import { Plan } from "./query";
import { flatMap, toArray } from "@db-auto/utils";
import { idHere, idThere } from "./tables";


export interface SelectData {
  table: string,
  alias: string,
  columns: string[],
  where: string[],
}

export function whereFor ( plan: Plan ): string[] {
  let planLink = plan.linkToPrevious;
  if ( planLink === undefined ) return plan.where;
  const link = planLink.link
  const previousTable = planLink.linkTo

  return [ ...plan.where, `${previousTable.alias}.${idThere ( link )} = ${plan.alias}.${idHere ( link )}` ]
}
export function selectDataForOne ( plan: Plan, view: string ): SelectData {
  return {
    alias: plan.alias,
    table: plan.table.table,
    columns: toArray ( plan.table?.views?.[ view ] ),
    where: whereFor ( plan )
  }
}


export const selectData = ( view: string ) => ( plan: Plan, ): SelectData[] => {
  const nextData = plan.linkToPrevious ? selectData ( view ) ( plan.linkToPrevious.linkTo ) : []
  return [ ...nextData, selectDataForOne ( plan, view ) ]
};

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

export function sqlFor ( m: MergedSelectData ): string[] {
  const columns = m.columns.map ( c => `${c.alias}.${c.column}` ).join ( ', ' )
  const tables = m.tables.map ( t => `${t.table} ${t.alias}` ).join ( ', ' )
  const where = m.where.length > 0 ? `where ${m.where.join ( ' and ' )}` : ''
  return [ `select ${columns}`, `   from ${tables} ${where}`.trimRight () ]
}