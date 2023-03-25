import { Plan } from "./query";
import { flatMap, toArray } from "@db-auto/utils";
import { idHere, idThere } from "./tables";


export interface SelectData {
  table: string,
  alias: string,
  columns: string[],
  where?: string,
}

export function whereFor ( plan: Plan ) {
  let planLink = plan.planLink;
  if ( planLink === undefined ) return undefined;
  const link = planLink.link;
  return `${plan.alias}.${idHere ( link )} = ${planLink.linkTo.alias}.${idThere ( link )}`
}
export function selectDataForOne ( plan: Plan, view: string ): SelectData {
  return {
    alias: plan.alias,
    table: plan.table.tableName,
    columns: toArray ( plan.table?.views?.[ view ] ),
    where: whereFor ( plan )
  }
}
export const selectData = ( view: string ) => ( plan: Plan, ): SelectData[] => {
  const nextData = plan.planLink ? selectData ( view ) ( plan.planLink.linkTo ) : []
  return [ selectDataForOne ( plan, view ), ...nextData ]
};

export interface MergedSelectData {
  tables: { table: string, alias: string }[]
  columns: { alias: string, column: string }[],
  where?: string[]
}
export function mergeSelectData ( selectData: SelectData[] ): MergedSelectData {
  const tables = selectData.map ( s => ({ table: s.table, alias: s.alias }) )
  const columns = flatMap ( selectData, s => s.columns.map ( c => ({ alias: s.alias, column: c }) ) )
  const where = selectData.map ( s => s.where ).filter ( w => w !== undefined )
  return { tables, columns, where }

}

export function sqlFor ( m: MergedSelectData ) {
  const columns = m.columns.map ( c => `${c.alias}.${c.column}` ).join ( ', ' )
  const tables = m.tables.map ( t => `${t.table} ${t.alias}` ).join ( ', ' )
  const where = m.where.length > 0 ? `where ${m.where.join ( ' and ' )}` : ''
  return `select ${columns}` + ` from ${tables} ${where}`
}