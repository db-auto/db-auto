import { CommonEnvironment, DalDialect } from "@dbpath/dal";
import { oracleRowNum } from "./oracleDal";

export interface OracleEnv extends CommonEnvironment {
  connection: string,
  schema: string
}

export const oracleDalDialect: DalDialect = {
  limitFn: ( pageNum: number, pageSize: number, s: string[] ) => {
    if ( s.length === 0 ) return s
    const copy = [ s[ 0 ].replace ( 'select ', 'select rownum,' ), ...s.slice ( 1 ) ]
    const start = 1 + (pageNum - 1) * pageSize
    const stop = (pageNum) * pageSize
    return [ `select *
              from (select /*+ FIRST_ROWS(n) */ a.*, ROWNUM ${oracleRowNum} from (`,
      ...copy,
      `) a  where ROWNUM <= ${stop} )  where ${oracleRowNum}  >= ${start}` ];
  },
  safeQuery: 'SELECT 1 FROM DUAL'
}