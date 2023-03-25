import { ErrorsAnd, mapErrors, NameAnd } from "@db-auto/utils";
import { HereLinkAndThereLink, Link, Table } from "./tables";
import { CleanTable } from "./clean";

export interface DbAutoQuery {
  path: string[],
  params: NameAnd<string>
}

export interface Plan {

  table: CleanTable,
  alias: string,
  planLink?: PlanLink

}
export interface PlanLink {
  link: Link,
  linkTo: Plan,
}


export function buildPlan ( tables: NameAnd<CleanTable>, path: string[] ): ErrorsAnd<Plan | undefined> {
  if ( path.length === 0 ) return [ 'Cannot build plan for empty path' ]
  let table = tables[ path[ 0 ] ];
  let planLinkOrErrors = buildNextStep ( tables, path, table, 1 );
  return mapErrors ( planLinkOrErrors, planLink => ({ table, alias: `T${0}`, planLink }) )

}
function buildNextStep ( tables: NameAnd<CleanTable>, path: string[], table: CleanTable, index: number ): ErrorsAnd<PlanLink | undefined> {
  if ( index >= path.length ) return undefined;
  const p = path[ index ];
  const link: Link = table.links[ p ];
  if ( link === undefined ) return [ `Cannot find link ${p} in table ${table.table}. Full path is ${path}.  Available links are: ${Object.keys ( table.links )}` ];
  const nextTable = tables[ link.table ];

  if ( nextTable === undefined ) return [ `Cannot find table ${p} in tables. Path is ${path.slice ( 0, index )}. Available tables are: ${Object.keys ( tables )}` ];
  let nextPlanLinkOrErrors = buildNextStep ( tables, path, nextTable, index + 1 );
  return mapErrors ( nextPlanLinkOrErrors, planLink => ({ link, linkTo: { planLink, alias: `T${index}`, table: nextTable } }) );
}