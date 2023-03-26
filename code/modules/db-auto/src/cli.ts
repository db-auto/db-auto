import { Command } from "commander";
import { ErrorsAnd, flatMapErrors, hasErrors, mapErrors, mapObject, NameAnd, parseFile, reportErrors } from "@db-auto/utils";
import { CleanTable, findQueryParams, makePathSpec, prettyPrintTables } from "@db-auto/tables";
import { makeCreateTableSqlForMock } from "@db-auto/mocks";
import { cleanConfig, CleanConfig } from "./config";
import { findFileInParentsOrError } from "@db-auto/files";
import { currentEnvironment, prettyPrintEnvironments, saveEnvName, sqlDialect } from "@db-auto/environments";
import { prettyPrintPP, processPathString, tracePlan } from "./path";


export function makeConfig ( cwd: string, envVars: NameAnd<string> ): ErrorsAnd<CleanConfig> {
  return flatMapErrors ( findFileInParentsOrError ( cwd, "db-auto.json" ), file =>
    flatMapErrors ( parseFile ( file ), config =>
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
      const envAndNameOrErrors = currentEnvironment ( cwd, config.environments, options.env )
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
      let pathSpec = makePathSpec ( path, id, fullOptions, where );
      if ( fullOptions.trace ) {
        const pps = await tracePlan ( envAndNameOrErrors, config.tables, pathSpec, fullOptions )
        pps.forEach ( line => console.log ( line ) )
        return
      }
      const errorsOrresult = await processPathString ( envAndNameOrErrors, config.tables, pathSpec, fullOptions );
      if ( hasErrors ( errorsOrresult ) ) {
        reportErrors ( errorsOrresult );
        return
      }
      prettyPrintPP ( fullOptions, true, errorsOrresult ).forEach ( line => console.log ( line ) )
    } )
  findQueryParams ( config.tables ).forEach ( param => program.option ( '--' + param.name + " <" + param.name + ">", param.description ) )


  const mock = program
    .command ( 'mocks' )
    .arguments ( '[tables...]' )
    .action ( ( tables, command, options ) => {
      const theTables: NameAnd<CleanTable> = config.tables
      var rest = mapObject ( theTables, table => makeCreateTableSqlForMock ( table ) )
      console.log ( JSON.stringify ( rest, null, 2 ) )
    } )

  const envs = program.command ( 'envs' )
    .action ( ( command, options ) => {
      const envAndNameOrErrors = currentEnvironment ( cwd, config.environments, options.env )
      if ( hasErrors ( envAndNameOrErrors ) ) {
        reportErrors ( envAndNameOrErrors )
        return;
      }
      console.log ( "Current environment is " + envAndNameOrErrors.envName )
      prettyPrintEnvironments ( config.environments ).forEach ( line => console.log ( line ) )
    } )

  const env = program.command ( 'env' )
    .arguments ( '<env>' )
    .action ( ( env, command, options ) => {
      const check = config.environments[ env ]
      if ( !check ) {
        console.log ( `Environment ${env} is not defined` )
        process.exit ( 1 )
      }
      saveEnvName ( cwd, env )
    } )

  const tables = program.command ( 'tables' )
    .action ( ( command, options ) => {
      prettyPrintTables ( config.tables ).forEach ( line => console.log ( line ) )
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