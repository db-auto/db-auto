import { Command } from "commander";
import { ErrorsAnd, flatMapErrors, hasErrors, mapErrors, mapObject, NameAnd, parseFile, reportErrors } from "@db-auto/utils";
import { CleanTable, findQueryParams, makePathSpec, prettyPrintTables } from "@db-auto/tables";
import { makeCreateTableSqlForMock } from "@db-auto/mocks";
import { cleanConfig, CleanConfig } from "./config";
import { findFileInParentsOrError } from "@db-auto/files";
import { prettyPrintEnvironments } from "@db-auto/environments";
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
export function makeProgram ( config: CleanConfig, version: string ): Command {
  let program = new Command ()
    .name ( 'db-auto' )
    .usage ( '<command> [options]' )
    .argument ( '<path>', "the list of table names joined by a . For example driver.mission.mission_aud" )
    .argument ( '[id]', "the id of the primary key in the first table in the path" )
    .option ( '-p, --plan', "show the plan instead of executing", false )
    .option ( '-s, --sql', "show the sql instead of executing", false )
    .option ( '-t, --trace', "trace the results", false )
    .option ( '-w, --where [where...]', "a where clause added to the query. There is no syntax checking", [] )
    // .allowUnknownOption ( true )
    .version ( version )
    .action ( ( path, id, options ) => {
      const where = options.where ? options.where : []
      let pathSpec = makePathSpec ( path, id, options, where );
      if ( options.trace ) {
        tracePlan ( config.tables, pathSpec, options ).forEach ( line => console.log ( line ) )
        return
      }
      const errorsOrresult = processPathString ( config.tables, pathSpec, options );
      if ( hasErrors ( errorsOrresult ) ) {
        reportErrors ( errorsOrresult );
        return
      }
      prettyPrintPP ( errorsOrresult ).forEach ( line => console.log ( line ) )
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
      prettyPrintEnvironments ( config.environments ).forEach ( line => console.log ( line ) )
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