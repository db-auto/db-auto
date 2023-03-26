import { ErrorsAnd, flatMap, hasErrors, mapErrors, NameAnd } from "@db-auto/utils";
import { buildPlan, CleanTable, mergeSelectData, PathSpec, Plan, selectData, SelectData, sqlFor, SqlOptions } from "@db-auto/tables";
import { dalFor, Environment } from "@db-auto/environments";
import { DalResult, DalResultDisplayOptions, prettyPrintDalResult } from "@db-auto/dal";

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

export interface ResPP {
  type: 'res',
  res: DalResult
}
type PP = SelectDataPP | LinksPP | SqlPP | ResPP


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


interface ProcessPathOptions extends DalResultDisplayOptions, SqlOptions {
  plan?: boolean,
  sql?: boolean
  fullSql?: boolean
}
export async function processPathString ( env: Environment, tables: NameAnd<CleanTable>, pathSpec: PathSpec, options: ProcessPathOptions ): Promise<ErrorsAnd<PP>> {
  const path = pathSpec.path
  if ( path.length === 0 ) return [ 'Path must have at least one part' ]
  const lastPart = path[ path.length - 1 ]
  if ( lastPart.endsWith ( '?' ) ) return processQueryPP ( tables, path )
  let plan = buildPlan ( tables, pathSpec );
  if ( hasErrors ( plan ) ) return plan
  const data = selectData ( "all" ) ( plan )
  const { plan: showPlan, sql: showSql, fullSql } = options
  if ( showPlan ) return { type: 'selectData', data }
  const optionsModifiedForLimits = showSql && !fullSql ? { ...options, limitBy: undefined } : options
  const sql = sqlFor ( optionsModifiedForLimits ) ( mergeSelectData ( data ) );
  if ( showSql || fullSql ) return ({ type: 'sql', sql })
  const dal = dalFor ( env )
  try {
    const result: ResPP = { type: 'res', res: await dal.query ( sql.join ( ' ' ), ) }
    return result
  } finally {
    dal.close ()
  }

}

export function prettyPrintPP ( options: DalResultDisplayOptions, pp: PP ): string[] {
  if ( pp.type === 'links' ) return [ "Links:", '  ' + pp.links.join ( ', ' ) ]
  if ( pp.type === 'selectData' ) return [ JSON.stringify ( pp.data, null, 2 ) ]
  if ( pp.type === 'sql' ) return pp.sql
  if ( pp.type === 'res' ) return prettyPrintDalResult ( options, pp.res )
  throw new Error ( `Unknown PP type\n${JSON.stringify ( pp )}` )
}

export function makeTracePlanSpecs ( pathSpec: PathSpec ): PathSpec[] {
  const path = pathSpec.path
  const result: PathSpec[] = []
  for ( let i = 0; i < path.length; i++ ) {
    result.push ( { ...pathSpec, path: path.slice ( 0, i + 1 ) } )
  }
  return result;
}
export async function tracePlan ( env: Environment, tables: NameAnd<CleanTable>, pathSpec: PathSpec, options: ProcessPathOptions ): Promise<string[]> {
  const result: PP[] = []
  const specs = makeTracePlanSpecs ( pathSpec )
  for ( let i = 0; i < specs.length; i++ ) {
    const pp = await processPathString ( env, tables, specs[ i ], options )
    if ( hasErrors ( pp ) ) return pp
    result.push ( pp )
  }
  return flatMap<PP, string> ( result, ( pp, i ) => [ `${specs[ i ].path.join ( '.' )}`, ...prettyPrintPP ( options, pp ), '' ] )
}
