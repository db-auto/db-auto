import { cleanEnvironment, Environment } from "./environments";
import { NameAnd } from "@dbpath/utils";
import { PostgresEnv } from "@dbpath/postgres";
import { OracleEnv } from "@dbpath/oracle";

const postgressEnvWithoutUsernamePassword: PostgresEnv = { type: 'postgres', host: 'localhost',schema: 'public', port: 5432, 'database': 'postgres' };
const postgresEnv: PostgresEnv = { ...postgressEnvWithoutUsernamePassword, username: 'phil', password: 'phil' };
const oracle: OracleEnv = { connection: "someConnect", schema: "someSchema", type: 'oracle', username: 'phil', password: 'phil' };

export const environment: NameAnd<Environment> = {
  "dev": postgresEnv,
  "test": postgressEnvWithoutUsernamePassword,
  "oracle": oracle,

}

export const cleanEnv = cleanEnvironment ( process.env, environment );