import { Command } from "commander";
import { ErrorsAnd, flatMapErrors, hasErrors, mapErrors, mapErrorsK, NameAnd, parseFile, reportErrors, toColumns } from "@dbpath/utils";
import { makePathSpec } from "@dbpath/tables";
import { cleanConfig, CleanConfig } from "./config";
import { findDirectoryHoldingFileOrError, findFileInParentsOrError } from "@dbpath/files";
import { checkStatus, currentEnvironment, dbPathDir, EnvStatus, prettyPrintEnvironments, saveEnvName, sqlDialect, statusColDefn, useDalAndEnv } from "@dbpath/environments";
import { prettyPrintPP, processPathString, tracePlan } from "./path";
import Path from "path";
import * as fs from "fs";

import { loadMetadata, saveMetadata } from "./metadataFile";
import { initConfig } from "./init";


export const configFileName = 'dbpath.config.json';
export function makeConfig ( cwd: string, envVars: NameAnd<string> ): ErrorsAnd<CleanConfig> {
  return flatMapErrors ( findFileInParentsOrError ( cwd, dbPathDir ), dir =>
    flatMapErrors ( parseFile ( Path.join ( dir, configFileName ) ), config =>
      mapErrors ( config, cleanConfig ( envVars ) ) ) )
}

export function findVersion () {
  let packageJsonFileName = "../../package.json";
  try {
    return require ( packageJsonFileName ).version
  } catch ( e ) {
    return "version not known"
  }
}
export function makeProgram ( cwd: string, config: CleanConfig, version: string ): Command {
  let program = new Command ()
    .name ( 'dbpath' )
    .usage ( '<command> [options]' )
    .argument ( '<path>', "the list of table names joined by a . For example driver.mission.mission_aud" )
    .argument ( '[id]', "the id of the primary key in the first table in the path" )
    .option ( ' --plan', "show the plan instead of executing", false )
    .option ( '-s, --sql', "show the sql instead of executing", false )
    .option ( '-e, --env <env>', "override the default environment. Use 'dbpath envs' to see a list of names" )
    .option ( '--fullSql', "normally the show sql doesn't include limits. This shows them", false )
    .option ( '-c, --count', "returns the count of the items in the table", false )
    .option ( '-d, --distinct', "only return distinct values", false )
    .option ( '--page <page> ', "which page of the results should be returned" )
    .option ( "--pageSize <pageSize>", "Changes the page of the returned results", parseInt, 15 )
    .option ( '-t, --trace', "trace the results", false )
    .option ( '-j, --json', "Sql output as json instead of columns", false )
    .option ( '--onelinejson', "Sql output as 'one json per line for the row' instead of columns", false )
    .option ( '--notitles', "Sql output as columns doesn't have titles", false )
    .option ( '-w, --where [where...]', "a where clause added to the query. There is no syntax checking", [] )
    // .allowUnknownOption ( true )
    .version ( version )
    .action ( async ( path, id, options ) => {
      //TODO move sql dialect here..
      const envAndNameOrErrors = currentEnvironment ( cwd, dbPathDir, config.environments, options.env )
      if ( hasErrors ( envAndNameOrErrors ) ) {
        reportErrors ( envAndNameOrErrors )
        return;
      }
      const meta = await loadMetadata ( cwd, envAndNameOrErrors.envName )
      if ( hasErrors ( meta ) ) {
        console.log ( 'Cannot load metadata for environment ' + envAndNameOrErrors.envName )
        console.log ( 'Try running db-auto refresh' )
        reportErrors ( meta )
        return
      }

      const { env, envName } = envAndNameOrErrors
      const dialect = sqlDialect ( env.type );
      const page = options.page ? parseInt ( options.page ) : 1
      const fullOptions = { ...options, limitBy: dialect.limitFn, page }

      if ( page < 1 ) throw new Error ( "Page must be greater than 0" )
      const where = fullOptions.where ? fullOptions.where : []
      let pathSpec = makePathSpec ( path, meta.tables, id, fullOptions, where );
      if ( fullOptions.trace ) {
        const pps = await tracePlan ( envAndNameOrErrors, config.summary, meta, pathSpec, fullOptions )
        pps.forEach ( line => console.log ( line ) )
        return
      }
      const errorsOrresult = await processPathString ( envAndNameOrErrors, config.summary, meta, pathSpec, fullOptions );
      if ( hasErrors ( errorsOrresult ) ) {
        reportErrors ( errorsOrresult );
        return
      }
      prettyPrintPP ( fullOptions, true, errorsOrresult ).forEach ( line => console.log ( line ) )
    } )
  // findQueryParams ( config.tables ).forEach ( param => program.option ( '--' + param.name + " <" + param.name + ">", param.description ) )

  const admin = program.command ( 'admin' ).description ( 'commands for viewing and manipulating the configuration of dbpath' )
  const status = admin.command ( 'status' ).description ( "Checks that the environments are accessible and gives report" )
    .action ( async ( options, command ) => {
      const status: NameAnd<EnvStatus> = await checkStatus ( config.environments )
      toColumns ( statusColDefn ) ( Object.values ( status ) ).forEach ( line => console.log ( line ) )
      // console.log ( JSON.stringify ( status, null, 2 ) )
    } )

  const env = admin.command ( 'env' ).description ( "Sets the current environment" )
    .arguments ( '<env>' )
    .action ( ( env, options, command ) => {
      const check = config.environments[ env ]
      if ( !check ) {
        console.log ( `Environment ${env} is not defined` )
        process.exit ( 1 )
      }
      saveEnvName ( cwd, dbPathDir, env )
    } )


  const init = admin.command ( 'init' ).description ( "Initialises the dbpath configuration: Warning this is destructive!" )
    .option ( '--force', 'If set to true then it will overwrite the existing configuration even if it exists' )
    .action ( async ( options, command ) => {
      if ( hasErrors ( config ) || options.force ) {
        mapErrors ( reportErrors ( initConfig ( cwd ) ), filename => {
          console.log ( `Initialised config in ${filename}.` )
          console.log ( `You need to edit it to set up the database access information` )
        } )
      } else console.log ( 'Not going to initialise because it already exists. Use --force to override' )
    } )

  const envs = admin.command ( 'envs' ).description ( "Lists all the environments" )
    .action ( ( options, command ) => {
      const envAndNameOrErrors = currentEnvironment ( cwd, dbPathDir, config.environments, options.env )
      if ( hasErrors ( envAndNameOrErrors ) ) {
        reportErrors ( envAndNameOrErrors )
        return;
      }
      console.log ( "Current environment is " + envAndNameOrErrors.envName )
      prettyPrintEnvironments ( config.environments ).forEach ( line => console.log ( line ) )
    } )

  const metadata = program.command ( 'metadata' ).description ( 'commands for viewing and storing metadata' )

  const metadataLive = metadata.command ( 'live' )
    .description ( 'Gets the metadata from the database and just displays it' )
    .argument ( '[env]', 'The environment' )
    .action ( async ( envArg, options, command ) => {
      reportErrors ( await useDalAndEnv ( cwd, config.environments, envArg, async dalAndEnv => {
        console.log ( JSON.stringify ( await dalAndEnv.dal.metaData (), null, 2 ) )
        return null;
      } ) )
    } )
  const metadataShow = metadata.command ( 'show' )
    .description ( 'Displays the stored metadata for the environment' )
    .argument ( '[env]', 'The environment' )
    .action ( async ( envArg, options, command ) => {
      reportErrors ( await mapErrorsK ( await currentEnvironment ( cwd, dbPathDir, config.environments, envArg ), async envAndNameOrErrors => {
          let errorsOrData = await loadMetadata ( cwd, envAndNameOrErrors.envName );
          if ( hasErrors ( errorsOrData ) ) return [ `Cannot display stored meta data for ${envAndNameOrErrors.envName}. Perhaps you need to dbpath metadata refresh ${envAndNameOrErrors.envName}.  Reason is`, ...errorsOrData ];
          return console.log ( JSON.stringify ( errorsOrData, null, 2 ) );
        }
      ) )
    } )

  const metadataRefresh = metadata.command ( 'refresh' )
    .description ( 'Fetches the metadata from an environment' )
    .argument ( '[env]', 'The environment' )
    .action ( async ( envArg, options, command ) =>
      reportErrors ( await useDalAndEnv ( cwd, config.environments, envArg, async ( { dal, envName } ) => {
        let meta = await dal.metaData ();
        return saveMetadata ( cwd, envName, meta );
      } ) ) );

  const metadataStatus = metadata.command ( 'status' )
    .description ( 'Shows which environments have metadata recorded' )
    .action ( async ( options, command ) => {
      reportErrors ( Object.keys ( config.environments ).map ( env =>
        mapErrors ( findDirectoryHoldingFileOrError ( cwd, dbPathDir ), dir =>
          console.log ( env.padEnd ( 12 ), fs.existsSync ( Path.join ( dir, dbPathDir, env, 'metadata.json' ) ) ) ) ) );
    } )


  return program;
}

export function processProgram ( program: Command, args: string[] ): void {
  if ( args.length == 2 ) {
    program.outputHelp ();
    process.exit ( 0 );
  }
  program.parseAsync ( args );
}