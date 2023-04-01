import { CommonEnvironment, DalDialect } from "@dbpath/dal";

export interface OracleEnv extends CommonEnvironment {
  connection: string,
  schema: string
}

export const oracleDalDialect: DalDialect = {
  limitFn: ( pageNum: number, pageSize: number, s: string[] ) => s,
  safeQuery: 'SELECT 1 FROM DUAL'
}