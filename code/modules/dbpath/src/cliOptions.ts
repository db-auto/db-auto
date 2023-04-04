import { CleanConfig } from "./config";
import { CleanEnvironment, currentEnvironment, dbPathDir, sqlDialect } from "@dbpath/environments";
import { DalDialect, DatabaseMetaData, DisplayOptions } from "@dbpath/dal";
import { ErrorsAnd, mapErrors, mapErrorsK, prefixAnyErrors, safeArray } from "@dbpath/utils";
import { loadMetadata } from "./metadataFile";


export interface CommonSqlOptionsFromCli {
  config: CleanConfig
  envName: string
  env: CleanEnvironment
  meta: DatabaseMetaData
  dialect: DalDialect

  display: DisplayOptions
}
export async function commonSqlOptions ( cwd: string, config: CleanConfig, options: any ): Promise<ErrorsAnd<CommonSqlOptionsFromCli>> {
  return mapErrorsK ( currentEnvironment ( cwd, dbPathDir, config.environments, options.env ), async ( { env, envName } ) =>
    mapErrors ( prefixAnyErrors ( await loadMetadata ( cwd, envName ), `Cannot load metadata for environment ${envName}`, `Try running dbpath metadata refresh` ),
      meta => {
        let page = options.page ? parseInt ( options.page ) : 1;
        let pageSize = options.pageSize ? parseInt ( options.pageSize ) : 15;
        if ( page < 1 ) return [ "Page must be greater than 0" ]
        if ( pageSize < 1 ) return [ "Page size must be greater than 0" ]
        let result: CommonSqlOptionsFromCli = {
          config, env, envName, meta,
          dialect: sqlDialect ( env.type ),
          display: {
            json: options.json,
            onelinejson: options.onelinejson,
            notitles: options.notitles,
            page,
            pageSize
          }
        };
        return result
      } ) )
}

export interface JustPathOptions {
  showPlan: boolean
  showSql: boolean
  where: string[]
  fullSql: boolean,
  count: boolean
  distinct: boolean
}
export function justPathOptions ( options: any ): JustPathOptions {
  return {
    showPlan: options.plan,
    showSql: options.sql,
    fullSql: options.fullSql,
    where: safeArray ( options.where ),
    count: options.count,
    distinct: options.distinct,
  }
}