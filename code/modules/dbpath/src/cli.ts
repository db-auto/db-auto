import { Command } from "commander";
import { ErrorsAnd, flatMapErrors, hasErrors, mapErrors, NameAnd, parseFile, reportErrors, toColumns } from "@dbpath/utils";
import { makePathSpec } from "@dbpath/tables";
import { cleanConfig, CleanConfig } from "./config";
import { findDirectoryHoldingFileOrError, findFileInParentsOrError } from "@dbpath/files";
import { checkStatus, currentEnvironment, dbPathDir, EnvStatus, prettyPrintEnvironments, saveEnvName, sqlDialect, statusColDefn, useDalAndEnv } from "@dbpath/environments";
import { prettyPrintPP, processPathString, tracePlan } from "./path";
import Path from "path";
import * as fs from "fs";
import { sampleMeta, sampleSummary } from "@dbpath/fixtures";
import { loadMetadata, saveMetadata } from "./metadataFile";


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
    .name ( 'db-auto' )
    .usage ( '<command> [options]' )
    .argument ( '<path>', "the list of table names joined by a . For example driver.mission.mission_aud" )
    .argument ( '[id]', "the id of the primary key in the first table in the path" )
    .option ( ' --plan', "show the plan instead of executing", false )
    .option ( '-s, --sql', "show the sql instead of executing", false )
    .option ( '-e, --env <env>', "override the default environment. Use 'db-auto envs' to see a list of names" )
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
      const { env, envName } = envAndNameOrErrors
      const dialect = sqlDialect ( env.type );
      const page = options.page ? parseInt ( options.page ) : 1
      const fullOptions = { ...options, limitBy: dialect.limitFn, page }

      if ( page < 1 ) throw new Error ( "Page must be greater than 0" )
      const where = fullOptions.where ? fullOptions.where : []
      let pathSpec = makePathSpec ( path, sampleMeta.tables, id, fullOptions, where );
      if ( fullOptions.trace ) {
        const pps = await tracePlan ( envAndNameOrErrors, sampleSummary, sampleMeta, pathSpec, fullOptions )
        pps.forEach ( line => console.log ( line ) )
        return
      }
      const errorsOrresult = await processPathString ( envAndNameOrErrors, sampleSummary, sampleMeta, pathSpec, fullOptions );
      if ( hasErrors ( errorsOrresult ) ) {
        reportErrors ( errorsOrresult );
        return
      }
      prettyPrintPP ( fullOptions, true, errorsOrresult ).forEach ( line => console.log ( line ) )
    } )
  // findQueryParams ( config.tables ).forEach ( param => program.option ( '--' + param.name + " <" + param.name + ">", param.description ) )

  const admin = program.command ( 'admin' ).description ( 'commands for viewing and manipulating the configuration of dbpath' )
  const status = admin.command ( 'status' ).description ( "Checks that the environments are accessible and gives report" )
    .action ( async ( command, options ) => {
      const status: NameAnd<EnvStatus> = await checkStatus ( config.environments )
      toColumns ( statusColDefn ) ( Object.values ( status ) ).forEach ( line => console.log ( line ) )
      // console.log ( JSON.stringify ( status, null, 2 ) )
    } )

  const env = admin.command ( 'env' ).description ( "Sets the current environment" )
    .arguments ( '<env>' )
    .action ( ( env, command, options ) => {
      const check = config.environments[ env ]
      if ( !check ) {
        console.log ( `Environment ${env} is not defined` )
        process.exit ( 1 )
      }
      saveEnvName ( cwd, dbPathDir, env )
    } )

  const envs = admin.command ( 'envs' ).description ( "Lists all the environments" )
    .action ( ( command, options ) => {
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
    .action ( async ( envArg, command, options ) => {
      reportErrors ( await useDalAndEnv ( cwd, config.environments, envArg, async dalAndEnv => {
        console.log ( JSON.stringify ( await dalAndEnv.dal.metaData (), null, 2 ) )
        return null;
      } ) )
    } )
  const metadataShow = metadata.command ( 'show' )
    .description ( 'Displays the stored metadata for the environment' )
    .argument ( '[env]', 'The environment' )
    .action ( async ( envArg, command, options ) => {
      reportErrors ( mapErrors ( await currentEnvironment ( cwd, dbPathDir, config.environments, options.env ), envAndNameOrErrors =>
        console.log ( JSON.stringify ( loadMetadata ( cwd, envAndNameOrErrors.envName ), null, 2 ) )
      ) )
    } )

  const metadataRefresh = metadata.command ( 'refresh' )
    .description ( 'Fetches the metadata from an environment' )
    .argument ( '[env]', 'The environment' )
    .action ( async ( envArg, command, options ) =>
      useDalAndEnv ( cwd, config.environments, envArg, async ( { dal, envName } ) =>
        saveMetadata ( cwd, envName, await dal.metaData () ) ) );

  const metadataStatus = metadata.command ( 'status' )
    .description ( 'Shows which environments have metadata recorded' )
    .action ( async ( command, options ) => {
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