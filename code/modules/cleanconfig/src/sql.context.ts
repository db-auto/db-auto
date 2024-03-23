import { CleanConfig } from "./clean.config";
import { ErrorsAnd, mapErrors, mapErrorsK, prefixAnyErrors } from "@dbpath/utils";
import { CleanEnvironment, currentEnvironment, dbPathDir, sqlDialect } from "@dbpath/environments";
import { DalDialect, DatabaseMetaData, DisplayOptions } from "@dbpath/dal";
import { loadMetadata } from "./metadataFile";

export type SqlContextOptions = {
  env?: string
  json?: boolean
  onelinejson?: boolean
  notitles?: boolean
  page?: string
  pageSize?: string
}

export interface SqlContext {
  config: CleanConfig
  envName: string
  env: CleanEnvironment
  meta: DatabaseMetaData
  dialect: DalDialect
  display: DisplayOptions
}

export async function sqlContext ( cwd: string, config: CleanConfig, options: SqlContextOptions ): Promise<ErrorsAnd<SqlContext>> {
  return mapErrorsK ( currentEnvironment ( cwd, dbPathDir, config.environments, options.env ), async ( { env, envName } ) =>
    mapErrors ( prefixAnyErrors ( await loadMetadata ( cwd, envName ), `Cannot load metadata for environment ${envName}`, `Try running dbpath metadata refresh` ),
      meta => {
        let page = options.page ? parseInt ( options.page ) : 1;
        let pageSize = options.pageSize ? parseInt ( options.pageSize ) : 15;
        if ( page < 1 ) return [ "Page must be greater than 0" ]
        if ( pageSize < 1 ) return [ "Page size must be greater than 0" ]
        let result: SqlContext = {
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
