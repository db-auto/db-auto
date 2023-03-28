#!/usr/bin/env node

import { hasErrors, reportErrors } from "@dbpath/utils";
import { findVersion, makeConfig, makeProgram, processProgram } from "./src/cli";
import Path from "path";

let cwd = process.cwd();
const config = makeConfig ( cwd, process.env );
if ( hasErrors ( config ) ) {
  reportErrors ( config );
  process.exit ( 1 );
}
const program = makeProgram ( cwd,config, findVersion () );
processProgram ( program, process.argv );





