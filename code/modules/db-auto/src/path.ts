import { ErrorsAnd, hasErrors, mapErrors, NameAnd } from "@db-auto/utils";
import { buildPlan, clean, CleanTable, mergeSelectData, PathSpec, Plan, selectData, SelectData, sqlFor } from "@db-auto/tables";

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


function findLinks ( tables: NameAnd<CleanTable>, path: string[] ): ErrorsAnd<LinksPP> {
  let withoutQuery = path.slice ( 0, -1 );

  if ( withoutQuery.length === 0 ) return { links: Object.keys ( tables ), type: 'links' }
  const planOrErrors: string[] | Plan = buildPlan ( clean, { path: withoutQuery, wheres: [], queryParams: {}, id: undefined } )
  if ( hasErrors ( planOrErrors ) ) return planOrErrors
  return { links: Object.keys ( planOrErrors.table.links ), type: 'links' }
}

const filterLinkPP = ( lookfor: string ) => ( l: LinksPP ): LinksPP => {
  let links = l.links.filter ( l => l.startsWith ( lookfor ) );
  return ({ type: 'links', links });
};

function processQueryPP ( tables: NameAnd<CleanTable>, parts: string[] ): ErrorsAnd<LinksPP> {
  let lastPart = parts[ parts.length - 1 ];
  return mapErrors ( findLinks ( tables, parts ), filterLinkPP ( lastPart.substring ( 0, lastPart.length - 1 ) ) )
}


interface ProcessPathOptions {
  showPlan?: boolean,
  where?: string[]

}
export function processPathString ( tables: NameAnd<CleanTable>, pathSpec: PathSpec, showPlan?: boolean, ): ErrorsAnd<PP> {
  const path = pathSpec.path
  if ( path.length === 0 ) return [ 'Path must have at least one part' ]
  const lastPart = path[ path.length - 1 ]
  if ( lastPart.endsWith ( '?' ) ) return processQueryPP ( tables, path )
  let plan = buildPlan ( clean, pathSpec );
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