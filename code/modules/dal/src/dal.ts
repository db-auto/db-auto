import { NameAnd } from "@dbpath/utils";

export interface CommonEnvironment {
  type: string,
  username?: string,
  password?: string
}

export interface DalDialect {
  limitFn: ( pageNum: number, pageSize: number, s: string[] ) => string[]
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
export interface HasPk{
  pk: NameAndType[]

}
export interface TableMetaData extends HasPk{
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
interface DalColMeta {
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

export function useDal<T> ( dal: Dal, fn: ( d: Dal ) => T ): T {
  try {
    return fn ( dal )
  } finally {
    dal.close ()
  }
}