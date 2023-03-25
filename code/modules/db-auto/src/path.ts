import { ErrorsAnd, hasErrors, NameAnd } from "@db-auto/utils";
import { buildPlan, clean, CleanTable, lastPlan, mergeSelectData, Plan, selectData, SelectData, sqlFor } from "@db-auto/tables";

export interface SelectDataPP {
  type: 'selectData',
  data: SelectData[]
}

export interface LinksPP {
  type: 'links',
  links: string[]
}

export interface SqlPP {
  type: 'sql',
  sql: string[]
}
type PP = SelectDataPP | LinksPP | SqlPP


function processQueryPP ( tables: NameAnd<CleanTable>, parts: string[] ): ErrorsAnd<LinksPP> {

  let withoutQuery = parts.slice ( 0, -1 );
  if ( withoutQuery.length === 0 ) return { type: "links", links: Object.keys ( tables ) }
  const planOrErrors: string[] | Plan = buildPlan ( clean, withoutQuery )
  if ( hasErrors ( planOrErrors ) ) return planOrErrors

  let lp = lastPlan ( planOrErrors );
  const links: string[] = Object.keys ( lp.table.links )
  return { type: 'links', links }
}
export function processPathString ( tables: NameAnd<CleanTable>, path: string, showPlan?: boolean ): ErrorsAnd<PP> {
  const parts = path.split ( '.' )
  if ( parts.length === 0 ) return [ 'Path must have at least one part' ]
  const lastPart = parts[ parts.length - 1 ]
  if ( lastPart === '?' ) return processQueryPP ( tables, parts )
  let plan = buildPlan ( clean, parts );
  if ( hasErrors ( plan ) ) return plan
  const data = selectData ( "all" ) ( plan )
  if ( showPlan ) return { type: 'selectData', data }
  return ({ type: 'sql', sql: sqlFor ( mergeSelectData ( data ) ) })

}

export function prettyPrintPP ( pp: PP ): string[] {
  if ( pp.type === 'links' ) return [ "Links:", '  ' + pp.links.join ( ', ' ) ]
  if ( pp.type === 'selectData' ) return [ JSON.stringify ( pp.data, null, 2 ) ]
  return pp.sql
}