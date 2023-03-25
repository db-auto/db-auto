#!/usr/bin/env node

import { hasErrors, reportErrors } from "@db-auto/utils";
import { makeConfig, makeProgram, processProgram } from "./src/cli";

const config = makeConfig ( process.cwd (), process.env );
if ( hasErrors ( config ) ) {
  reportErrors ( config );
  process.exit ( 1 );
}

const program = makeProgram ( config, "0.0.1" );
processProgram ( program, process.argv );





