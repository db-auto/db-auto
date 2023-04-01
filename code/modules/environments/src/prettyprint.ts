import { ColumnDefn, NameAnd, toColumns } from "@dbpath/utils";
import { CleanEnvironment, EnvStatus, mapEnv } from "./environments";


export const envColumnData: NameAnd<ColumnDefn<CleanEnvironment>> = {
  "Environment": { dataFn: ( t: CleanEnvironment, ) => t.name },
  "Type": { dataFn: ( t: CleanEnvironment ) => t.type },
  "Host": { dataFn: ( t: CleanEnvironment ) => mapEnv ( t, e => e.host, e => '' ) },
  "Port": { dataFn: ( t: CleanEnvironment ) => mapEnv ( t, e => e.port === undefined ? '' : e.port.toString (), e => '' ) },
  "Database": { dataFn: ( t: CleanEnvironment ) => mapEnv ( t, e => e.database, e => '' ) },
  "Schema": { dataFn: ( t: CleanEnvironment ) => mapEnv ( t, e => e.database, e => '' ) },
  "UserName": { dataFn: ( t: CleanEnvironment ) => t.username },
  "Connection": { dataFn: ( t: CleanEnvironment ) => mapEnv ( t, e => '', e => e.connection ) },

}

export const statusColDefn: NameAnd<ColumnDefn<EnvStatus>> = {
  "Environment": { dataFn: ( t: EnvStatus, ) => t.name },
  "Up": { dataFn: ( t: EnvStatus ) => t.up.toString () },
  "Type": { dataFn: ( t: EnvStatus ) => t.env.type },
  "Host": { dataFn: ( t: EnvStatus ) => mapEnv ( t.env, e => e.host, e => '' ) },
  "Port": { dataFn: ( t: EnvStatus ) => mapEnv ( t.env, e => e.port === undefined ? '' : e.port.toString (), e => '' ) },
  "Database": { dataFn: ( t: EnvStatus ) => mapEnv ( t.env, e => e.database, e => '' ) },
  "Schema": { dataFn: ( t: EnvStatus ) => mapEnv ( t.env, e => e.database, e => '' ) },
  "UserName": { dataFn: ( t: EnvStatus ) => t.env.username },
  "Connection": { dataFn: ( t: EnvStatus ) => mapEnv ( t.env, e => '', e => e.connection ) },

}


export function prettyPrintEnvironments ( envs: NameAnd<CleanEnvironment> ) {
  return toColumns ( envColumnData ) ( Object.values ( envs ) )

}