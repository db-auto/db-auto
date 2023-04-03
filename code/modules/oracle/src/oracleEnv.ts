import { CommonEnvironment, DalDialect } from "@dbpath/dal";
import { hackLimitFnForPaging } from "./limitFn.hack";

export interface OracleEnv extends CommonEnvironment {
  connection: string,
  schema: string
}

export const oracleDalDialect: DalDialect = {
  limitFn: hackLimitFnForPaging,
  safeQuery: 'SELECT 1 FROM DUAL'
}