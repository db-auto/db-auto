import { cleanEnvironment, Environment } from "./environments";
import { NameAnd } from "@db-auto/utils";

export const environment: NameAnd<Environment> = {
  "dev": {
    type: "postgres",
    url: "postgres://localhost:5432/dev",
    username: "sa",
    password: ""
  },
  "test": {
    type: "postgres",
    url: "postgres://localhost:5432/test"
  }
}

export const cleanEnv = cleanEnvironment ( process.env, environment );