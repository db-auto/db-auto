import { CommonEnvironment, DalDialect } from "@dbpath/dal";

export interface OracleEnv extends CommonEnvironment {
  connection: string,
  schema: string
}

export const oracleDalDialect: DalDialect = {
  limitFn: ( pageNum: number, pageSize: number, s: string[] ) => {
    const start = 1 + (pageNum - 1) * pageSize
    const stop = (pageNum) * pageSize
    return [ `select /*+ FIRST_ROWS(${stop}) */ * from (`,
      ...s,
      `)  where rownum >= ${start} AND rownum<= ${stop}` ]
  },
  safeQuery: 'SELECT 1 FROM DUAL'
}