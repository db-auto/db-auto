#!/usr/bin/env node

import { buildPlan, clean, mergeSelectData, selectData, sqlFor } from "@db-auto/tables";
import { mapErrors } from "@db-auto/utils";
import { Command } from "commander";


// function getConfig ( name: string ): Config {
//   try {
//     const rawConfig = JSON.parse ( fs.readFileSync ( name ).toString ( 'utf8' ) );
//     return validate ( "'dbConfig.json'", configValidator, rawConfig,
//       config => config,
//       errors => {
//         console.log ( 'Invalid!!!', errors );
//         process.exit ( 1 );
//       } )
//   } catch ( e ) {
//     console.error ( 'Error reading config file: ', name, e );
//     process.exit ( 1 );
//   }
// }
// var config = cleanConfig ( process.env, getConfig ( '.dbConfig.json' ) );
// console.log ( JSON.stringify ( config, null, 2 ) );
const version = "1.0.0";//require ( "../../package.json" ).version
const config = clean

var program: Command = require ( 'commander' )
  .name ( 'db-auto' )
  .usage ( '<command> [options]' )
  .arguments ( '<path>', "the list of table names joined by a . For example driver.mission.mission_aud" )
  .version ( version )
  .action ( ( command, options ) => {
    const path = command.split ( "." )
    const res = mapErrors ( buildPlan ( clean, path ), plan => sqlFor ( mergeSelectData ( selectData ( "all" ) ( plan ) ) ) )
    console.log ( "command", command, " produces:" )
    console.log ( res )
  } )


const params = process.argv;
if ( params.length == 2 ) {
  program.outputHelp ();
  process.exit ( 0 );
}
const parsed = program.parseAsync ( params );





