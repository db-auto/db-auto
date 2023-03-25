import { CleanTable } from "./clean";
import { flatMapEntries, flatMapErrors, mapEntries, NameAnd, unique } from "@db-auto/utils";

export interface QueryParam {
  name: string;
  description: string;
}

export function findQueryParams ( t: NameAnd<CleanTable> ): QueryParam[] {
  return unique ( flatMapEntries ( t, ( table, name ) => mapEntries ( table.queries, ( q, name ) =>
    ({ name, description: q.description }) ) ), t => t.name )
}