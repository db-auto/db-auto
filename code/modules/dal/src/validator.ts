import { Summary } from "@dbpath/config";
import { DatabaseMetaData, TableMetaData } from "./dal";
import { mapEntries, mapObject, safeObject } from "@dbpath/utils";

export interface TwoIds {
  fromId: string,
  toId: string
}
export type ValidateTableNameFn = ( tableName: string, fullTableName?: string ) => string[]
export type ValidateFieldsFn = ( tableName: string, fields: string[] ) => string[]
export type ValidateLinkFn = ( fromTableName: string, toTableName: string, idEquals: TwoIds[] ) => string[]
/** These will be called at suitable times during parsing
 * The table name in driver!driver_table would be 'driver', so the valdiation has to handle summaries
 */

export interface PathValidator {
  validateTableName: ValidateTableNameFn,
  validateFields: ValidateFieldsFn,
  validateLink: ValidateLinkFn
}

export const PathValidatorAlwaysOK: PathValidator = {
  validateTableName: (): string[] => [],
  validateFields: (): string[] => [],
  validateLink: () => []
}

function checkFullTableName ( m: DatabaseMetaData, tableName: string ) {
  const foundInMeta = m.tables[ tableName ]
  return foundInMeta
    ? []
    : [ `Table ${tableName} is not known. Legal tables`, `  ${Object.keys ( m.tables ).sort ()}` ];
}
function theTableName ( summary: Summary, tableName: string, fullTableName: string ) {
  const foundInSummary = summary.tables[ tableName ]
  const nameToCheck = fullTableName ? fullTableName : foundInSummary ? foundInSummary.tableName : tableName
  return nameToCheck;
}
function getTableMetaData ( summary: Summary, m: DatabaseMetaData, tableName: string ) {
  const nameToCheck = theTableName ( summary, tableName, undefined );
  const foundInMeta = m.tables[ nameToCheck ]
  if ( !foundInMeta ) throw Error ( 'Should not happen - validate table name should have happened before this' )
  return foundInMeta
}
export const validateTableName = ( summary: Summary, m: DatabaseMetaData ): ValidateTableNameFn => {
  return ( tableName, fullTableName ) => {
    const nameToCheck = theTableName ( summary, tableName, fullTableName );
    return checkFullTableName ( m, nameToCheck );
  }
}

export const validateFields = ( summary: Summary, m: DatabaseMetaData ): ValidateFieldsFn => {
  return ( tableName, fields ) => {
    const table = getTableMetaData ( summary, m, tableName )
    const foundInFields = fields.filter ( f => !table.columns[ f ] )
    return foundInFields.length === 0
      ? []
      : [ `Fields ${foundInFields} are not known for table ${tableName}. Legal fields`, `  ${Object.keys ( table.columns ).sort ()}` ];
  }
}

interface FkLinks {
  fromTable: string,
  fromId: string,
  toTable: string,
  toId: string
}

function validateLinksInFks ( fromTableName: string, fromTable: TableMetaData, toTableName: string, toTable: TableMetaData ): string[] {
  function error ( msg: string ): string[] {
    const nameToFkLinks = mapEntries ( safeObject ( fromTable.fk ), v => `  ${fromTableName}.(${v.column},${v.refColumn})${v.refTable}` )
    return [ msg + '. Valid links are ', ...nameToFkLinks ]
  }
  const found = mapEntries ( safeObject ( fromTable.fk ), fk => fk.refTable ).filter ( table => table === toTableName )
  if ( found.length === 0 ) return error ( `No foreign key from ${fromTableName} to ${toTableName}` )
  if ( found.length > 1 ) return error ( `More than one foreign key from ${fromTableName} to ${toTableName}` )
  return []

}
const notInError = ( tableName: string, fromTable: TableMetaData ) => ( fields: string[] ): string[] => {
  if ( fields.length === 0 ) return []
  return [ `Fields ${fields} are not known for table ${tableName}. Legal fields`, `  ${Object.keys ( fromTable.columns ).sort ()}` ]

};
export const validateLinks = ( summary: Summary, m: DatabaseMetaData ): ValidateLinkFn => {
  return ( fromTableName, toTableName, idEquals ) => {
    const fromTable: TableMetaData = getTableMetaData ( summary, m, fromTableName )
    const toTable = getTableMetaData ( summary, m, toTableName )
    if ( idEquals.length === 0 ) return validateLinksInFks ( fromTableName, fromTable, toTableName, toTable )
    const notInFromTable = notInError ( fromTableName, fromTable ) ( idEquals.filter ( i => !fromTable.columns[ i.fromId ] ).map ( t => t.fromId ) )
    const notInToTable = notInError ( toTableName, toTable ) ( idEquals.filter ( i => !toTable.columns[ i.toId ] ).map ( t => t.toId ) )
    return notInFromTable.concat ( notInToTable )
  }
}