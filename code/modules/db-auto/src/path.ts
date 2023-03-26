import { ErrorsAnd, flatMap, flatMapErrors, foldErrors, hasErrors, mapErrors, NameAnd } from "@db-auto/utils";
import { buildPlan, CleanTable, mergeSelectData, PathSpec, Plan, selectData, SelectData, sqlFor } from "@db-auto/tables";

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
  const planOrErrors: string[] | Plan = buildPlan ( tables, { path: withoutQuery, wheres: [], queryParams: {}, id: undefined } )
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
  plan?: boolean,
  sql?: boolean

}
export function processPathString ( tables: NameAnd<CleanTable>, pathSpec: PathSpec, options: ProcessPathOptions ): ErrorsAnd<PP> {
  const path = pathSpec.path
  if ( path.length === 0 ) return [ 'Path must have at least one part' ]
  const lastPart = path[ path.length - 1 ]
  if ( lastPart.endsWith ( '?' ) ) return processQueryPP ( tables, path )
  let plan = buildPlan ( tables, pathSpec );
  if ( hasErrors ( plan ) ) return plan
  const data = selectData ( "all" ) ( plan )
  const { plan: showPlan, sql: showSql } = options
  if ( showPlan ) return { type: 'selectData', data }
  return ({ type: 'sql', sql: sqlFor ( mergeSelectData ( data ) ) })

}

export function prettyPrintPP ( pp: PP ): string[] {
  if ( pp.type === 'links' ) return [ "Links:", '  ' + pp.links.join ( ', ' ) ]
  if ( pp.type === 'selectData' ) return [ JSON.stringify ( pp.data, null, 2 ) ]
  return pp.sql
}

export function makeTracePlanSpecs ( pathSpec: PathSpec ): PathSpec[] {
  const path = pathSpec.path
  const result: PathSpec[] = []
  for ( let i = 0; i < path.length; i++ ) {
    result.push ( { ...pathSpec, path: path.slice ( 0, i + 1 ) } )
  }
  return result;
}
export function tracePlan ( tables: NameAnd<CleanTable>, pathSpec: PathSpec, options: ProcessPathOptions ): string[] {
  const result: PP[] = []
  const specs = makeTracePlanSpecs ( pathSpec )
  for ( let i = 0; i < specs.length; i++ ) {
    const pp = processPathString ( tables, specs[ i ], options )
    if ( hasErrors ( pp ) ) return pp
    result.push ( pp )
  }
  return flatMap<PP, string> ( result, ( pp, i ) => [ `${specs[ i ].path.join ( '.' )}`, ...prettyPrintPP ( pp ), '' ] )
}
