import { NameAnd, safeArray, safeObject } from "@dbpath/utils";
import { HasPk } from "@dbpath/dal";


export interface PathSpecForWheres {
  id?: string,
  table2Pk: NameAnd<HasPk>
  wheres?: string[]
  queryParams?: NameAnd<string>,
}
export interface PathSpec extends PathSpecForWheres {
  rawPath: string,
  path: string[],
  id: string | undefined,
  queryParams: NameAnd<string>,
  limit?: number
}

export function makePathSpec ( path: string, table2Pk?: NameAnd<HasPk>, id?: string, queryParams?: NameAnd<string>, wheres?: string[] ): PathSpec {
  return {
    rawPath: path,
    path: path.split ( '.' ).filter ( p => p !== '' ),
    id,
    table2Pk,
    queryParams: safeObject ( queryParams ),
    wheres: safeArray ( wheres )
  }
}
export function quoteIfNeeded ( type: string, s: string ): string {
  return type === 'string' || type.includes ( 'char' ) || type.includes ( 'text' ) || type.includes ( 'date' ) || type.includes ( 'time' ) ? `'${s}'` : s;
}

