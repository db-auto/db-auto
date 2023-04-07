import { ErrorsAnd, flatMap, hasErrors, mapErrors, mapErrorsK, NameAnd } from "@dbpath/utils";
import { makePathSpec, mergeSelectData, pathToSelectData, SelectData, sqlFor } from "@dbpath/tables";
import { CleanEnvironment, dalFor } from "@dbpath/environments";
import { parsePath, preprocessor } from "@dbpath/pathparser";
import { Summary } from "@dbpath/config";
import { isLinkInPath, LinkInPath, PathItem } from "@dbpath/types";
import { CommonSqlOptionsFromCli, JustPathOptions } from "./cliOptions";
import { DalPathValidator, DalResult, DisplayOptions, ForeignKeyMetaData, fullTableName, PathValidator, PathValidatorAlwaysOK, prettyPrintDalResult, TableMetaData, useDal } from "@dbpath/dal";
import { preprocessorFnForScript } from "@dbpath/scripts";

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
export interface UpdatePP {
  type: 'update',
  res: number
}
export type PP = SelectDataPP | LinksPP | SqlPP | ResPP | UpdatePP


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

export async function executeSelectOrUpdate ( env: CleanEnvironment, sql: string[], update: boolean | undefined ): Promise<ErrorsAnd<PP>> {
  return update ? executeUpdate ( env, sql ) : executeSelect ( env, sql );
}

export async function executeSelect ( env: CleanEnvironment, sql: string[] ): Promise<ErrorsAnd<PP>> {
  return mapErrorsK ( await dalFor ( env ), async dal => {
    return useDal ( dal, async dal => {
      try {
        let res = await dal.query ( sql.join ( ' ' ), );
        return { type: 'res', res: res }
      } catch ( e ) {
        return [ `Error processing`, sql, '', e.message ]
      }
    } )
  } )
}
export async function executeUpdate ( env: CleanEnvironment, sql: string[] ): Promise<ErrorsAnd<PP>> {
  return mapErrorsK ( await dalFor ( env ), async dal => {
    return useDal ( dal, async dal => {
      try {
        let res = await dal.update ( sql.join ( ' ' ), );
        return { type: 'update', res: res }
      } catch ( e ) {
        return [ `Error processing `, sql, '', e.message ]
      }
    } )
  } )
}
export async function processPathString ( commonSqlOptions: CommonSqlOptionsFromCli, path: string, id: string | undefined, justPathOptions: JustPathOptions ): Promise<ErrorsAnd<PP>> {
  const { env, envName, dialect, meta, config, display } = commonSqlOptions
  const { showSql, fullSql, showPlan, where } = justPathOptions
  let summary = config.summary;
  if ( path.length === 0 ) return [ 'Path must have at least one part' ]
  const lastPart = path[ path.length - 1 ]
  if ( lastPart.endsWith ( '?' ) ) return processQueryPP ( summary, meta.tables, path )
  let validator = DalPathValidator ( summary, meta );
  const scriptIdFn: ( s: string ) => string = preprocessorFnForScript ( {} )
  let plan: ErrorsAnd<PathItem> = mapErrors ( preprocessor ( scriptIdFn, path ), parsePath ( validator ) );
  if ( hasErrors ( plan ) ) return plan
  const pathSpec = makePathSpec ( env.schema, path, meta.tables, id, where )
  const data = pathToSelectData ( plan, pathSpec )
  if ( showPlan ) return { type: 'selectData', data }
  const limitBy = showSql && !fullSql ? undefined : dialect.limitFn
  const optionsModifiedForLimits = { ...display, ...justPathOptions, limitBy } //: display

  const sql = sqlFor ( optionsModifiedForLimits ) ( mergeSelectData ( data ) );
  if ( showSql || fullSql ) return ({ type: 'sql', sql, envName })
  return await executeSelect ( env, sql );
}

export function prettyPrintPP ( options: DisplayOptions, showSql: boolean, pp: PP ): string[] {
  if ( pp.type === 'links' ) return [ "Links:", '  ' + pp.links.join ( ', ' ) ]
  if ( pp.type === 'selectData' ) return [ JSON.stringify ( pp.data, null, 2 ) ]
  if ( pp.type === 'sql' ) {
    let env = showSql ? [ `Environment: ${pp.envName}` ] : [];
    return [ ...env, ...pp.sql ]
  }
  if ( pp.type === 'res' ) return prettyPrintDalResult ( options, pp.res )
  if ( pp.type === 'update' ) return [ `Updated ${pp.res} rows` ]
  throw new Error ( `Unknown PP type\n${JSON.stringify ( pp )}` )
}

export function makeTracePaths ( path: string ): string[] {
  const parts = path.split ( '.' )
  const result: string[] = []
  for ( let i = 0; i < parts.length; i++ ) result.push ( parts.slice ( 0, i + 1 ).join ( '.' ) )
  return result
}
export async function tracePlan ( commonSqlOptions: CommonSqlOptionsFromCli, path: string, id: string | undefined, justPathOptions: JustPathOptions ): Promise<string[]> {
  const result: PP[] = []
  const { envName, display } = commonSqlOptions
  const paths = makeTracePaths ( path )
  for ( let i = 0; i < paths.length; i++ ) {
    const pp = await processPathString ( commonSqlOptions, paths[ i ], id, justPathOptions )
    if ( hasErrors ( pp ) ) return pp
    result.push ( pp )
  }
  return [ `Environment: ${envName}`, ...flatMap<PP, string> ( result, ( pp, i ) =>
    [ `${paths[ i ]}`, ...prettyPrintPP ( display, false, pp ), '' ] ) ]
}
