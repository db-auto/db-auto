import { CommonEnvironment } from "@dbpath/dal";

export interface OracleEnv extends CommonEnvironment {
  connection: string,
  schema: string
}