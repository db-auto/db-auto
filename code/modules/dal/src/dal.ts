import { NameAnd } from "@db-auto/utils";

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
export interface Dal extends ReadDal, WriteDal {
  close ();
}