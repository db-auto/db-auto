import { ErrorsAnd, hasErrors, mapErrors, NameAnd } from "@db-auto/utils";
import { Link } from "./tables";
import { CleanTable } from "./clean";

export interface DbAutoQuery {
  path: string[],
  params: NameAnd<string>
}

export interface Plan {

  linkToPrevious?: PlanLink,
  table: CleanTable,
  alias: string
  where: string[]

}
export interface PlanLink {
  link: Link,
  linkTo: Plan,
}

function quoteIfNeeded ( type: string, s: string ): string {
  return type === 'string' || type.includes ( 'char' ) ? `'${s}'` : s;
}

export function buildPlan ( tables: NameAnd<CleanTable>, path: string[], id?: string ): ErrorsAnd<Plan | undefined> {
  if ( path.length === 0 ) return [ 'Cannot build plan for empty path' ]
  let table = tables[ path[ 0 ] ];
  let alias = `T${0}`;
  const where: string[] = id ? [ `${alias}.${table.primary}=${quoteIfNeeded ( table.keys[ table.primary ].type, id )}` ] : []
  const plan = { table, alias: alias, where }
  return buildNextStep ( tables, path, plan, 1 );
}

function findLink ( table: CleanTable, linkName: string ): ErrorsAnd<Link> {
  const link = table.links[ linkName ];
  if ( link === undefined ) return [ `Cannot find link ${linkName} in table ${table.table}. Available links are: ${Object.keys ( table.links )}` ];
  return link;
}
function buildNextStep ( tables: NameAnd<CleanTable>, path: string[], previousPlan: Plan, index: number ): ErrorsAnd<Plan> {
  if ( index >= path.length ) return previousPlan;
  const p = path[ index ];

  const linkOrErrors: ErrorsAnd<Link> = findLink ( previousPlan.table, p );
  if ( hasErrors ( linkOrErrors ) ) return linkOrErrors;
  const link = linkOrErrors;
  const table = tables[ link.table ];

  if ( table === undefined ) return [ `Cannot find table ${p} in tables. Path is ${path.slice ( 0, index )}. Available tables are: ${Object.keys ( tables )}` ];
  const plan: Plan = { table, alias: `T${index}`, linkToPrevious: { link, linkTo: previousPlan }, where: [] }
  return buildNextStep ( tables, path, plan, index + 1 );

}