import { DatabaseMetaData } from "@dbpath/dal";
import { ErrorsAnd, flatMapErrors, hasErrors, mapAndforEachErrorFn, mapErrors, NameAnd } from "@dbpath/utils";

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

export const findTableName = ( meta: DatabaseMetaData, summary: EnvSummary ) => ( s: string ): ErrorsAnd<string> => {
  const table = summary?.tables?.[ s ]?.tableName
  const fullName = table ? table : s
  if ( meta.tables[ fullName ] === undefined ) return [ `Table ${fullName} not found. Legal names are ${Object.keys ( meta.tables ).sort ()}` ]
  return table === undefined || table === s ? s : table
};

export const checkFields = ( meta: DatabaseMetaData, table: string ) => ( fields: string[] ): ErrorsAnd<void> => {
  const allFields: string[] = findAllFieldsNames ( meta ) ( table )
  const errors = allFields.filter ( f => !fields.includes ( f ) )
  if ( errors.length > 0 ) return [ `Fields ${errors} not found in table ${table}. Legal names are ${allFields}` ]
  return undefined
}

interface TableAndFieldPart {
  table: string
  fields: string | undefined
}

interface PathparserTable {
  table: string
  fullTable: string
  fields: string[] | undefined
}
export const findTablePartAndFieldPart = ( s: string ): TableAndFieldPart => {
  const matchStructure = s.match ( /^[a-zA-Z0-9_-]*\[[a-zA-Z0-9_-]+(,[a-zA-Z0-9_-]*)*]$/ ) // e.g.asd[a,b,c]
  if ( matchStructure === null ) return { table: s, fields: undefined }
  const matchFields = s.match ( /^[a-zA-Z0-9_-]*\[([a-zA-Z0-9_\-,]*)]$/ ) // e.g. [a,b,c]
  if ( matchFields === null ) throw Error ( `findTablePartAndFieldPart: matchFields is null for ${s}` )
  const fields: string = matchFields[ 1 ]
  const table = s.slice ( 0, s.length - fields.length - 2 )
  return { table, fields }
}
export const tableParser = ( meta: DatabaseMetaData, summary: EnvSummary ) => {
  const find = findTableName ( meta, summary );
  return ( s: string ): ErrorsAnd<PathparserTable> => flatMapErrors ( findTablePartAndFieldPart ( s ), ( { table, fields: fieldsOrUndef } ) => {
    return flatMapErrors ( find ( table ), fullTable =>
      mapErrors ( findFieldNameFromSquareBrackets ( meta, summary ) ( fullTable ) ( fieldsOrUndef ), fields => {
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