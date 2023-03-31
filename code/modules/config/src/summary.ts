import { composeNameAndValidators, NameAnd, NameAndValidator, validateChild, validateChildString, validateNameAnd } from "@dbpath/utils";

interface TableSummary {
  tableName?: string
}
export interface Summary {
  tables: NameAnd<TableSummary>
}

export function cleanSummary ( summary: Summary ): Summary {
  return summary?.tables ? summary : { tables: {} };
}


export const tableSummaryValidator: NameAndValidator<TableSummary> = composeNameAndValidators (
  validateChildString ( 'tableName', true ),
);

export const summaryValidator: NameAndValidator<Summary> = composeNameAndValidators<Summary> (
  validateChild ( 'tables', validateNameAnd ( tableSummaryValidator ), true ) )
