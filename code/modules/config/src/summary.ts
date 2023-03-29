import { NameAnd } from "@dbpath/utils";

interface TableSummary {
  tableName?: string
}
export interface Summary {
  tables: NameAnd<TableSummary>
}