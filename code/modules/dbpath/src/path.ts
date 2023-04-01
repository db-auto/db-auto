import { ErrorsAnd, flatMap, hasErrors, mapErrors, mapErrorsK, NameAnd } from "@dbpath/utils";
import { mergeSelectData, PathSpec, pathToSelectData, SelectData, sqlFor, SqlOptions } from "@dbpath/tables";
import { dalFor, EnvAndName } from "@dbpath/environments";
import { DalPathValidator, DalResult, DalResultDisplayOptions, DatabaseMetaData, ForeignKeyMetaData, fullTableName, PathValidator, PathValidatorAlwaysOK, prettyPrintDalResult, TableMetaData, useDal } from "@dbpath/dal";
import { parsePath } from "@dbpath/pathparser";
import { Summary } from "@dbpath/config";
import { isLinkInPath } from "@dbpath/types";

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
  sql: string[],
  envName: string
}

export interface ResPP {
  type: 'res',
  res: DalResult
}
type PP = SelectDataPP | LinksPP | SqlPP | ResPP


const filterLinkPP = ( lookfor: string ) => ( raw: string[] ): LinksPP => {
  let links = raw.filter ( l => l.startsWith ( lookfor ) );
  return ({ type: 'links', links });
};

function processQueryPP ( summary: Summary, tableMD: NameAnd<TableMetaData>, rawPath: string ): ErrorsAnd<LinksPP> {
  const pathValidator: PathValidator = {
    ...PathValidatorAlwaysOK, actualTableName: t => fullTableName ( summary, t )
  };

  return mapErrors ( parsePath ( pathValidator ) ( rawPath ), lastTable => {
    const query = lastTable.table.slice ( 0, -1 )
    const prevTable = isLinkInPath ( lastTable ) ? lastTable.previousLink : undefined
    if ( prevTable === undefined ) return filterLinkPP ( query ) ( Object.keys ( tableMD ).sort () )
    const tableMeta = tableMD[ prevTable.table ]
    if ( tableMeta === undefined ) return [ `Don't recognise table ${prevTable.table}` ]
    const fkTables: ForeignKeyMetaData[] = Object.values ( tableMeta.fk ).filter ( fk => fk.refTable.startsWith ( query ) )
    return { type: 'links', links: fkTables.map ( fk => `(${fk.column}=${fk.refColumn})${fk.refTable}` ) };
  } )
}

interface ProcessPathOptions extends DalResultDisplayOptions, SqlOptions {
  plan?: boolean,
  sql?: boolean
  fullSql?: boolean

}


export async function processPathString ( envAndName: EnvAndName, summary: Summary, meta: DatabaseMetaData, pathSpec: PathSpec, options: ProcessPathOptions ): Promise<ErrorsAnd<PP>> {
  const path = pathSpec.path
  const { env, envName } = envAndName
  if ( path.length === 0 ) return [ 'Path must have at least one part' ]
  const lastPart = path[ path.length - 1 ]
  if ( lastPart.endsWith ( '?' ) ) return processQueryPP ( summary, meta.tables, pathSpec.rawPath )
  let validator = DalPathValidator ( summary, meta );
  let plan = parsePath ( validator ) ( pathSpec.rawPath );
  if ( hasErrors ( plan ) ) return plan
  const data = pathToSelectData ( plan, pathSpec )
  const { plan: showPlan, sql: showSql, fullSql } = options
  if ( showPlan ) return { type: 'selectData', data }
  const optionsModifiedForLimits = showSql && !fullSql ? { ...options, limitBy: undefined } : options
  const sql = sqlFor ( optionsModifiedForLimits ) ( mergeSelectData ( data ) );
  if ( showSql || fullSql ) return ({ type: 'sql', sql, envName })
  return mapErrorsK ( await dalFor ( env ), async dal => {
    return useDal ( dal, async d => {
      let res = await dal.query ( sql.join ( ' ' ), );
      const result: ResPP = { type: 'res', res: res }
      return result
    } )
  } )
}

export function prettyPrintPP ( options: DalResultDisplayOptions, showSql: boolean, pp: PP ): string[] {
  if ( pp.type === 'links' ) return [ "Links:", '  ' + pp.links.join ( ', ' ) ]
  if ( pp.type === 'selectData' ) return [ JSON.stringify ( pp.data, null, 2 ) ]
  if ( pp.type === 'sql' ) {
    let env = showSql ? [ `Environment: ${pp.envName}` ] : [];
    return [ ...env, ...pp.sql ]
  }
  if ( pp.type === 'res' ) return prettyPrintDalResult ( options, pp.res )
  throw new Error ( `Unknown PP type\n${JSON.stringify ( pp )}` )
}

export function makeTracePlanSpecs ( pathSpec: PathSpec ): PathSpec[] {
  const path = pathSpec.path
  const result: PathSpec[] = []
  for ( let i = 0; i < path.length; i++ ) {
    let p = path.slice ( 0, i + 1 );
    result.push ( { ...pathSpec, rawPath: p.join ( '.' ), path: p } )
  }
  return result;
}
export async function tracePlan ( env: EnvAndName, summary: Summary, meta: DatabaseMetaData, pathSpec: PathSpec, options: ProcessPathOptions ): Promise<string[]> {
  const result: PP[] = []
  const specs = makeTracePlanSpecs ( pathSpec )
  for ( let i = 0; i < specs.length; i++ ) {
    const pp = await processPathString ( env, summary, meta, specs[ i ], options )
    if ( hasErrors ( pp ) ) return pp
    result.push ( pp )
  }
  return [ `Environment: ${env.envName}`, ...flatMap<PP, string> ( result, ( pp, i ) =>
    [ `${specs[ i ].path.join ( '.' )}`, ...prettyPrintPP ( options, false, pp ), '' ] ) ]
}
