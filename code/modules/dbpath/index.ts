#!/usr/bin/env node

import { hasErrors, reportErrors } from "@dbpath/utils";
import { findVersion, makeConfig, makeProgram, processProgram } from "./src/cli";
import Path from "path";
import { CleanConfig } from "./src/config";

let cwd = process.cwd ();
const config = makeConfig ( cwd, process.env );
const isAdminInit = process.argv[ 2 ] === "admin" && process.argv[ 3 ] === "init"
if ( hasErrors ( config ) ) {
  if ( isAdminInit ) {
    processCli ( config as any ) // ok it is an error, but it's hard to not make all other commands more complex if we don't bodge it like this
      .then ( () => process.exit ( 0 ) )
  } else {
    if ( config.find ( e => e.startsWith ( "Cannot find .dbpath." ) ) ) {
      config.push ( "You need to run 'dbpath admin init' which will initialise the config file" );
      config.push ( "After that you need to tell dbpath about your databases by editing the config file. Instructions are given if you run 'dbpath admin init'" );
    }
    reportErrors ( config )
    process.exit ( 1 );
  }
} else {
  processCli ( config as CleanConfig );
}

function processCli ( config: CleanConfig ) {
  const program = makeProgram ( cwd, config, findVersion () );
  return processProgram ( program, process.argv );
}





