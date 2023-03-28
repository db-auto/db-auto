import { DatabaseMetaData } from "@dbpath/dal";
import { ErrorsAnd, flatMapErrors, hasErrors, mapAndforEachErrorFn, NameAnd } from "@dbpath/utils";

export interface TableSummary {
  tableName: string

}

export interface EnvSummary {
  tables: NameAnd<TableSummary>
}

export const findFieldName = ( meta: DatabaseMetaData, summary: EnvSummary ) => ( tableName: string ) => {
  const tableMeta = meta.tables[ tableName ]
  if ( tableMeta === undefined ) throw Error ( `FindFieldName: Table ${tableName} not found in meta\n${JSON.stringify ( meta )}` )
  return ( s: string ): ErrorsAnd<string> => {
    const field = tableMeta.columns[ s ]
    if ( field === undefined ) return [ `Field ${s} not found in table ${tableName}. Legal names are ${Object.keys ( tableMeta.columns ).sort ()}` ]
    return s
  };
}

interface FieldNames {
  fields: string[]
}
export const findFieldNameFromSquareBrackets = ( meta: DatabaseMetaData, summary: EnvSummary ) => ( tableName: string ) => {
  const find = findFieldName ( meta, summary ) ( tableName );
  return ( s: string | undefined ): ErrorsAnd<FieldNames> => {
    if ( s === undefined ) return { fields: findAllFieldsNames ( meta ) ( tableName ) }
    const rawFieldName = s.split ( ',' )
    const fields: string[] = []
    const voidOrErrors = mapAndforEachErrorFn ( rawFieldName, find, field => fields.push ( field ) )
    if ( hasErrors ( voidOrErrors ) ) return voidOrErrors
    return { fields }
  }
}

export const findAllFieldsNames = ( meta: DatabaseMetaData ) => ( tableName: string ) => {
  const tableMeta = meta.tables[ tableName ]
  if ( tableMeta === undefined ) throw Error ( `findAllFieldsNames: Table ${tableName} not found in meta\n${JSON.stringify ( meta )}` )
  return Object.keys ( tableMeta.columns )
}

export const findFullTableNameValidatingIfSpecified = ( meta: DatabaseMetaData, summary: EnvSummary ) => ( tableOrSummary: string, providedFullTableName: string ): ErrorsAnd<string> => {
  const foundTable = summary?.tables?.[ tableOrSummary ]?.tableName
  const fullName = foundTable ? foundTable : tableOrSummary
  if ( providedFullTableName && providedFullTableName !== fullName ) {
    if ( foundTable === undefined )
      return [ `Summary [${tableOrSummary}] is not found. Legal summaries are ${Object.keys ( summary.tables ).sort ()}` ]
    else
      return [ `Full table name [${providedFullTableName}]  for summary [${tableOrSummary}] does not match expected [${fullName}]` ]
  }
  if ( meta.tables[ fullName ] === undefined ) {
    if ( providedFullTableName === undefined )
      return [ `Table ${fullName} not found as either a summary or a table name. Legal summaries are ${Object.keys ( summary.tables ).sort ()} and full tables are ${Object.keys ( meta.tables ).sort ()}` ]
    else
      return [ `Table ${fullName} not found. Legal names are ${Object.keys ( meta.tables ).sort ()}` ]
  }
  return fullName
};

export const checkFields = ( meta: DatabaseMetaData, table: string ) => ( fields: string[] ): ErrorsAnd<void> => {
  const allFields: string[] = findAllFieldsNames ( meta ) ( table )
  const errors = allFields.filter ( f => !fields.includes ( f ) )
  if ( errors.length > 0 ) return [ `Fields ${errors} not found in table ${table}. Legal names are ${allFields}` ]
  return undefined
}

interface TablePart {
  table: string
  fullTable?: string
}
interface TableAndFieldPart extends TablePart {
  fields?: string
}

interface PathparserTable {
  table: string
  fullTable: string
  fields: string[] | undefined
}

export function findTableAndFullTable ( s: string ): TablePart {
  const matchStructure = s.match ( /^([a-zA-Z0-9_-]*)(![a-zA-Z0-9_-]+)?$/ )
  if ( matchStructure === null ) { return { table: s } }
  if ( matchStructure.length !== 3 ) throw Error ( `findTableAndFullTable: matchStructure.length(${matchStructure.length})!==3 for ${s}` )
  let fullTable = matchStructure[ 2 ];
  return { table: matchStructure[ 1 ], fullTable: fullTable ? fullTable.substring ( 1 ) : undefined }
}
export const findTablePartAndFieldPartWithoutValidation = ( s: string ): TableAndFieldPart => {
  const matchStructure = s.match ( /^[a-zA-Z0-9_-]*(![a-zA-Z0-9_-]+)?\[[a-zA-Z0-9_-]+(,[a-zA-Z0-9_-]*)*]$/ ) // e.g.asd[a,b,c]
  if ( matchStructure === null ) return findTableAndFullTable ( s )

  const matchFields = s.match ( /^([a-zA-Z0-9!_-]*)\[([a-zA-Z0-9_\-,]*)]$/ ) // e.g. [a,b,c]
  if ( matchFields === null ) throw Error ( `findTablePartAndFieldPart: matchFields is null for ${s}` )
  if ( matchFields.length !== 3 ) throw Error ( `findTablePartAndFieldPart: matchFields.length(${matchFields.length})!==2 for ${s}: ${matchFields}` )
  const table: string = matchFields[ 1 ]
  const fields: string = matchFields[ 2 ]
  return { ...findTableAndFullTable ( table ), fields }
}
export const tableParser = ( meta: DatabaseMetaData, summary: EnvSummary ) => {
  const find = findFullTableNameValidatingIfSpecified ( meta, summary );
  return ( s: string ): ErrorsAnd<PathparserTable> =>
    flatMapErrors ( findTablePartAndFieldPartWithoutValidation ( s ), ( { table, fullTable: givenFullTable, fields: fieldsOrUndef } ) => {
      return flatMapErrors ( find ( table, givenFullTable ), ( fullTable ) =>
        flatMapErrors ( findFieldNameFromSquareBrackets ( meta, summary ) ( fullTable ) ( fieldsOrUndef ), fields => {
          const result: PathparserTable = { table, fullTable, ...fields }
          return result
        } ) )
    } )

}
export const parsePath = ( meta: DatabaseMetaData, summary: EnvSummary ) => {
  const pParser = tableParser ( meta, summary )
  return ( s: string ): string => {
    const parts = s.split ( '.' )
    return parts.map ( pParser ).join ( '.' )
  }
}