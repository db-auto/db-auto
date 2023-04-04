import { NameAnd, safeArray, safeObject } from "@dbpath/utils";
import { HasPk } from "@dbpath/dal";


export interface PathSpecForWheres {
  schema: string,
  id?: string,
  table2Pk: NameAnd<HasPk>
  wheres?: string[]
}
export interface PathSpec extends PathSpecForWheres {
  rawPath: string,
  path: string[],
  id: string | undefined,
  limit?: number
}

export function makePathSpec ( schema: string, path: string, table2Pk?: NameAnd<HasPk>, id?: string, wheres?: string[] ): PathSpec {
  return {
    schema,
    rawPath: path,
    path: path.split ( '.' ).filter ( p => p !== '' ),
    id,
    table2Pk,
    wheres: safeArray ( wheres )
  }
}
export function quoteIfNeeded ( type: string, s: string ): string {
  return type === 'string' || type.includes ( 'char' ) || type.includes ( 'text' ) || type.includes ( 'date' ) || type.includes ( 'time' ) ? `'${s}'` : s;
}

