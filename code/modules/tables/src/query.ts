import { ErrorsAnd, flatMapEntries, hasErrors, NameAnd, safeArray, safeObject } from "@db-auto/utils";
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

export interface PathSpecForWheres {
  id: string | undefined,
  queryParams: NameAnd<string>,

}
export interface PathSpec extends PathSpecForWheres {
  path: string[],
  id: string | undefined,
  queryParams: NameAnd<string>,
  wheres: string[]
}

export function makePathSpec ( path: string, id?: string, queryParams?: NameAnd<string>, wheres?: string[] ): PathSpec {
  return {
    path: path.split ( '.' ).filter ( p => p !== '' ),
    id,
    queryParams: safeObject ( queryParams ),
    wheres: safeArray ( wheres )
  }
}
function quoteIfNeeded ( type: string, s: string ): string {
  return type === 'string' || type.includes ( 'char' ) || type.includes ( 'date' ) || type.includes ( 'time' ) ? `'${s}'` : s;
}

function makeWhere ( pathSpecForWheres: PathSpecForWheres, alias: string, table: CleanTable ) {
  const { id, queryParams } = pathSpecForWheres;
  const whereFromId = id ? [ `${alias}.${table.primary}=${quoteIfNeeded ( table.keys[ table.primary ].type, id )}` ] : [];
  const whereFromParams = flatMapEntries ( table.queries, ( q, n ) => {
    const name = q.name || n
    const inParams = queryParams[ name ];
    return inParams !== undefined ? [ `${alias}.${n}=${quoteIfNeeded ( q.type, inParams )}` ] : [];
  } )
  return [ ...whereFromId, ...whereFromParams ];
}
export function buildPlan ( tables: NameAnd<CleanTable>, pathSpec: PathSpec ): ErrorsAnd<Plan | undefined> {
  const path = pathSpec.path;
  if ( path.length === 0 ) return [ 'Cannot build plan for empty path' ]
  // const params = queryParams || {};
  let table = tables[ path[ 0 ] ];
  if ( table === undefined ) return [ `Cannot find table ${path[ 0 ]} in tables. Available tables are: ${Object.keys ( tables ).sort ()}` ];

  let alias = `T${0}`;
  const where: string[] = [ ...pathSpec.wheres, ...makeWhere ( pathSpec, alias, table ) ]
  const plan = { table, alias: alias, where }
  return buildNextStep ( tables, { ...pathSpec, id: undefined }, plan, 1 );
}

function findLink ( pathSoFar: string, table: CleanTable, linkName: string ): ErrorsAnd<Link> {
  const link = table.links[ linkName ];
  if ( link === undefined ) return [ `Cannot find link ${linkName} in table ${table.table} for path [${pathSoFar}]. Available links are: ${Object.keys ( table.links ).sort ()}` ];
  return link;
}
function buildNextStep ( tables: NameAnd<CleanTable>, pathSpec: PathSpec, previousPlan: Plan, index: number ): ErrorsAnd<Plan> {
  const path = pathSpec.path;
  if ( index >= path.length ) return previousPlan;
  const p = path[ index ];
  const pathSoFar = path.slice ( 0, index ).join ( '.' );
  const linkOrErrors: ErrorsAnd<Link> = findLink ( pathSoFar, previousPlan.table, p );
  if ( hasErrors ( linkOrErrors ) ) return linkOrErrors;
  const link = linkOrErrors;
  const table = tables[ link.table ];
  if ( table === undefined ) return [ `Cannot find table ${p} in tables. Path is ${pathSoFar}. Available tables are: ${Object.keys ( tables )}` ];
  let alias = `T${index}`;
  const where = makeWhere ( pathSpec, alias, table )

  const plan: Plan = { table, alias, linkToPrevious: { link, linkTo: previousPlan }, where }
  return buildNextStep ( tables, pathSpec, plan, index + 1 );

}