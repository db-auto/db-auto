import { Summary } from "@dbpath/config";
import { DatabaseMetaData, ForeignKeyMetaData, TableMetaData } from "./dal";
import { ErrorsAnd, hasErrors, mapEntries, safeObject } from "@dbpath/utils";
import { TwoIds, TwoIdsArray } from "@dbpath/types";

export type ValidateTableNameFn = ( tableName: string ) => string[]
export type ValidateFieldsFn = ( tableName: string, fields: string[] ) => string[]
export type ValidateLinkFn = ( fromTableName: string, toTableName: string, idEquals: TwoIds[] ) => string[]
/** These will be called at suitable times during parsing
 * The table name in driver!driver_table would be 'driver', so the valdiation has to handle summaries
 */

export interface PathValidator {
  validateTableName: ValidateTableNameFn,
  validateFields: ValidateFieldsFn,
  validateLink: ValidateLinkFn

  useIdsOrSingleFkLinkOrError ( fromTableName: string, toTableName: string, idEquals: TwoIds[] ): ErrorsAnd<TwoIdsArray>
  actualTableName ( tableName: string ): string
}

export const PathValidatorAlwaysOK: PathValidator = {
  validateTableName: (): string[] => [],
  validateFields: (): string[] => [],
  validateLink: () => [],
  useIdsOrSingleFkLinkOrError ( fromTableName: string, toTableName: string, idEquals: TwoIds[] ): ErrorsAnd<TwoIdsArray> {
    return { twoIds: idEquals };
  },
  actualTableName: t => t

}

function checkFullTableName ( m: DatabaseMetaData, tableName: string ) {
  const foundInMeta = m.tables[ tableName ]
  return foundInMeta
    ? []
    : [ `Table ${tableName} is not known. Legal tables`, `  ${Object.keys ( m.tables ).sort ()}` ];
}
export function fullTableName ( summary: Summary, tableName: string ) {
  const foundInSummary = summary.tables[ tableName ]
  const nameToCheck = foundInSummary ? foundInSummary.tableName : tableName
  return nameToCheck;
}
function getTableMetaData ( summary: Summary, m: DatabaseMetaData, tableName: string ) {
  const nameToCheck = fullTableName ( summary, tableName );
  const foundInMeta = m.tables[ nameToCheck ]
  if ( !foundInMeta ) throw Error ( 'Should not happen - validate table name should have happened before this' )
  return foundInMeta
}
export const validateTableName = ( summary: Summary, m: DatabaseMetaData ): ValidateTableNameFn => {
  return ( tableName ) => {
    const nameToCheck = fullTableName ( summary, tableName );
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


export function getSingleFkLink ( summary: Summary, m: DatabaseMetaData, fromTableName: string, toTableName: string ): ErrorsAnd<TwoIds> {
  const fromTable = getTableMetaData ( summary, m, fromTableName )
  const found: ForeignKeyMetaData[] = mapEntries ( safeObject ( fromTable.fk ), fk => fk ).filter ( table => table.refTable === toTableName );
  function error ( msg: string ): string[] {
    const nameToFkLinks = mapEntries ( safeObject ( fromTable.fk ), v => `  ${fromTableName}.(${v.column},${v.refColumn})${v.refTable}` )
    return [ msg + '. Valid links are ', ...nameToFkLinks ]
  }
  if ( found.length === 0 ) return error ( `No foreign key from ${fromTableName} to ${toTableName}` )
  if ( found.length > 1 ) return error ( `More than one foreign key from ${fromTableName} to ${toTableName}` )
  const result: TwoIds = { fromId: found[ 0 ].column, toId: found[ 0 ].refColumn }
  return result;
}
/** This should not throw an exception if the validation says there is a link */
export const useIdsOrSingleFkLinkOrError = ( summary: Summary, m: DatabaseMetaData ) => ( fromTableName: string, toTableName: string, idEquals: TwoIds[] ): ErrorsAnd<TwoIdsArray> => {
  if ( idEquals.length === 0 ) {
    const found = getSingleFkLink ( summary, m, fromTableName, toTableName )
    if ( hasErrors ( found ) ) return [ `Single FK link not found`, ...found ]
    return { twoIds: [ found ] }
  }
  return { twoIds: idEquals }
}


function validateLinksInFks ( summary: Summary, m: DatabaseMetaData, fromTableName: string, toTableName: string ): string[] {
  const found = getSingleFkLink ( summary, m, fromTableName, toTableName )
  if ( hasErrors ( found ) ) return found
  return []
}
const notInError = ( tableName: string, fromTable: TableMetaData ) => ( fields: string[] ): string[] => {
  if ( fields.length === 0 ) return []
  return [ `Fields ${fields} are not known for table ${tableName}. Legal fields`, `  ${Object.keys ( fromTable.columns ).sort ()}` ]

};
export const validateLinks = ( summary: Summary, m: DatabaseMetaData ): ValidateLinkFn => {
  return ( fromTableName, toTableName, idEquals ) => {
    if ( idEquals.length === 0 ) return validateLinksInFks ( summary, m, fromTableName, toTableName )

    const fromTable: TableMetaData = getTableMetaData ( summary, m, fromTableName )
    const toTable = getTableMetaData ( summary, m, toTableName )
    const notInFromTable = notInError ( fromTableName, fromTable ) ( idEquals.filter ( i => !fromTable.columns[ i.fromId ] ).map ( t => t.fromId ) )
    const notInToTable = notInError ( toTableName, toTable ) ( idEquals.filter ( i => !toTable.columns[ i.toId ] ).map ( t => t.toId ) )
    return notInFromTable.concat ( notInToTable )
  }
}

export function DalPathValidator ( summary: Summary, m: DatabaseMetaData ): PathValidator {
  return {
    validateTableName: validateTableName ( summary, m ),
    validateFields: validateFields ( summary, m ),
    validateLink: validateLinks ( summary, m ),
    useIdsOrSingleFkLinkOrError: useIdsOrSingleFkLinkOrError ( summary, m ),
    actualTableName: t => fullTableName ( summary, t )
  };
}