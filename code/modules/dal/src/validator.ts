import { Summary } from "@dbpath/config";
import { DatabaseMetaData, MetaDal } from "./dal";

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
export const validateTableName = ( summary: Summary, m: DatabaseMetaData ): ValidateTableNameFn => {
  return ( tableName, fullTableName ) => {
    const foundInSummary = summary.tables[ tableName ]
    const nameToCheck = fullTableName ? fullTableName : foundInSummary ? foundInSummary.tableName : tableName
    return checkFullTableName ( m, nameToCheck );
  }
}
