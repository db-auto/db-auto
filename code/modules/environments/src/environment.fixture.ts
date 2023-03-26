import { cleanEnvironment, Environment } from "./environments";
import { NameAnd } from "@db-auto/utils";
import { PostgresEnv } from "@db-auto/postgres";

const envWithoutUsernamePassword: PostgresEnv = { type: 'postgres', host: 'localhost', port: 5432, 'database': 'postgres' };
const env: PostgresEnv = { ...envWithoutUsernamePassword, username: 'phil', password: 'phil' };

export const environment: NameAnd<Environment> = {
  "dev": env,
  "test": envWithoutUsernamePassword
}

export const cleanEnv = cleanEnvironment ( process.env, environment );