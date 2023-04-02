import { NameAnd } from "@dbpath/utils";
import { type } from "os";

export interface CommonEnvironment {
  type: string,

  schema?: string,
  username?: string,
  password?: string
}

export type  LimitFn = ( pageNum: number, pageSize: number, s: string[] ) => string[]
export function checkLimitOrThrow ( l: LimitFn ): LimitFn {
  return ( pageNum, pageSize, s ) => {
    if ( typeof pageNum !== 'number' || pageNum < 1 ) throw new Error ( `Invalid page number (${typeof pageNum}) ${pageNum}` )
    if ( typeof pageSize !== 'number' || pageSize < 1 ) throw new Error ( `Invalid page size (${typeof pageSize}) ${pageSize}` )
    return l ( pageNum, pageSize, s )
  }
}

export interface DalDialect {
  limitFn: LimitFn
  safeQuery: string
}

export interface WriteDal {
  update: DalUpdateFn
}

export interface ColumnMetaData {
  type: string
}
export interface ForeignKeyMetaData {
  column: string
  refTable: string
  refColumn: string
  raw: string
}
export interface NameAndType {
  name: string,
  type: string
}
export interface HasPk {
  pk: NameAndType[]

}
export interface TableMetaData extends HasPk {
  columns: NameAnd<ColumnMetaData>
  fk: NameAnd<ForeignKeyMetaData>
}
export interface DatabaseMetaData {
  tables: NameAnd<TableMetaData>
}

export type MetaDataFn = () => Promise<DatabaseMetaData>
export interface MetaDal {
  metaData: () => Promise<DatabaseMetaData>

}
export interface DalRow extends NameAnd<any> {

}
export interface DalColMeta {
  name: string
}
export interface DalMeta {
  columns: DalColMeta[]
}
export interface DalResult {
  rows: DalRow[]
  meta: DalMeta
}
export type DalQueryFn = ( sql: string, ...params: any[] ) => Promise<DalResult>
export type DalUpdateFn = ( sql: string, ...params: any[] ) => Promise<number>
export interface ReadDal {
  query: DalQueryFn;
}
export interface Dal extends ReadDal, WriteDal, MetaDal {
  close ();
}

export async function useDal<T> ( dal: Dal, fn: ( d: Dal ) => T ): Promise<T> {
  try {
    return await fn ( dal )
  } finally {
    dal.close ()
  }
}