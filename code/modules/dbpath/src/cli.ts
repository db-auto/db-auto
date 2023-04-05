import { Command } from "commander";
import { ErrorsAnd, flatMapErrors, hasErrors, mapErrors, mapErrorsK, NameAnd, parseFile, reportErrors, safeArray, toArray, toColumns } from "@dbpath/utils";
import { cleanConfig, CleanConfig } from "./config";
import { findDirectoryHoldingFileOrError, findFileInParentsOrError } from "@dbpath/files";
import { checkStatus, currentEnvironment, dbPathDir, EnvStatus, prettyPrintEnvironments, saveEnvName, statusColDefn, useDalAndEnv } from "@dbpath/environments";
import { executeSelectOrUpdate, prettyPrintPP, processPathString, tracePlan } from "./path";
import Path from "path";
import * as fs from "fs";

import { loadMetadata, saveMetadata } from "./metadataFile";
import { initConfig } from "./init";
import { commonSqlOptions, justPathOptions, JustPathOptions } from "./cliOptions";


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
        await reportErrors ( await mapErrorsK ( await commonSqlOptions ( cwd, config, options ), async commonSqlOptions => {
            const pathOptions: JustPathOptions = justPathOptions ( options )
            if ( options.trace ) {
              const pps = await tracePlan ( commonSqlOptions, path, id, pathOptions )
              pps.forEach ( line => console.log ( line ) )
              return
            }
            return mapErrorsK ( await processPathString ( commonSqlOptions, path, id, pathOptions ), pp => {
              prettyPrintPP ( commonSqlOptions.display, true, pp ).forEach ( line => console.log ( line ) );
              return null
            } );
          }
        ) )
      }
    )

  const gettingStarted = program.command ( 'getting-started' ).description ( `Type 'dbpath getting-started' for instructions on how to get started` )
    .action ( async ( options, command ) => {
      console.log (
        `    Getting started with dbpath
    ===========================
    
    Config file
    ===========
    You need a config file that will store connection information to databases (database typem connection url, and maybe username/password etc)
           Note that while you can store usernames and passwords here, it is only recommend for 'getting started' and not for real use.
    To create this config file you can run 'dbpath admin init' which creates a '.dbpath' directory in the current directory and a config file in it.
    
    This file will be found if you run dbpath from any subdirectory of the current directory.
    
    Environments
    ============
    Once you have the config file, you can run 'dbpath admin envs' to see the environments that are defined in the config file.
    Note that these environments will not work for you: you have to set them up yourself. There are instructions in the config file to help
    
    You can check the environments by running 'dbpath admin status'. This will check that the environments are accessible and give a report.
    By default 'dev' is the current environment. You can change this by running 'dbpath admin env <env>' where <env> is the name of the environment you want to use.       
   
    Metadata
    ========
    You can load the metadata for the current environment by running 'dbpath metadata refresh'. This will create a file called 
    'metadata.json' in directory named after the environment under the '.dbpath' directory.
    
    Example usage
    =============
    dbpath driver                            views a table called 'driver'
    dbpath driver --page 2                   pages through the results: this is page 2
    dbpath driver --page 2 --pageSize 20     pages through the results: this is page 2 with 20 rows per page              
    dbpath driver 1                          views a row in the table called 'driver' with id 1
    dbpath driver.mission 1                  views a row in the table called 'mission' with id 1 in the table called 'driver'
                                             note that the links between driver and mission were found from the metadata
    dbpath driver  --count                   returns the number of rows in the table called 'driver'
    dbpath driver.{driverid,id}mission       joins driver and mission using driver.driverid= mission.id
    dbpath driver --where driverid=1         returns all rows in the table called 'driver' where driverid=1. Any where can be specified
    
    dbpath driver.mission.audit --sql        show the sql that would be run
    
    dbpath driver --json                     returns the results as json
    dbpath driver --onelinejson              returns the results as json, one json object per line (ideal for piping to jq)
    dbpath driver --notitles                 returns the results as columns, but without titles
    dbpath driver.mission.trace --trace      executes first 'driver' then 'driver.mission' and then 'driver.mission.audit'` )
    } )

  const selectCommand = program.command ( "sql" ).description ( "an arbitary (needs to be quoted) sql statement executed in the current environment" )
    .argument ( "<sql...>").description("The sql to execute. Currently will throw exceptions if not a select. " )
    .option ( "-p, --page <page>", "page through the results. You need to be sure it is ordered" )
    .option ( "-j,--json", "returns the results as json" )
    .option ( "-o, --onelinejson", "returns the results as json, one json object per line (ideal for piping to jq)" )
    .option ( "-n, --notitles", "returns the results as columns, but without titles" )
    .option ( "--pageSize <pageSize>", "     if you want consistency" )
    .option ( "-u, --update", "execute an update statement instead of a select" )
    .option ( "-s, --sql", "show sql that will execute (includes sql added for paging)" )
    .option ( '-f,--file <file>', 'file containing sql to execute' )
    .action ( async ( sql: string[],ignoreOpts: any, command: Command ) => {
      const options = command.optsWithGlobals ()
      await reportErrors ( await mapErrorsK ( await commonSqlOptions ( cwd, config, options ), async commonSqlOptions => {
        const rawSql: string[] = options.file ? fs.readFileSync ( options.file, 'utf8' ).split ( '\n' ) :  toArray(sql)
        const { page, pageSize } = commonSqlOptions.display
        const withPaging = options.update ? rawSql : commonSqlOptions.dialect.limitFn ( page, pageSize, rawSql )

        if ( options.sql ) return { sql: withPaging, type: 'sql', env: commonSqlOptions.envName }
        return mapErrorsK ( await executeSelectOrUpdate ( commonSqlOptions.env, withPaging, options.update ),
          pp => {
            prettyPrintPP ( commonSqlOptions.display, true, pp ).forEach ( line => console.log ( line ) )
            return null
          } );
      } ) )
    } )


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
        console.log ( `Environment ${env} is not defined. Legal values are ${Object.keys ( config.environments ).sort ()}` )
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

export function processProgram ( program: Command, args: string[] ): Promise<Command> {
  if ( args.length == 2 ) {
    program.outputHelp ();
    process.exit ( 0 );
  }
  return program.parseAsync ( args );
}