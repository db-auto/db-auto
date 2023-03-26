#!/usr/bin/env node

import { hasErrors, reportErrors } from "@db-auto/utils";
import { findVersion, makeConfig, makeProgram, processProgram } from "./src/cli";
import Path from "path";

const config = makeConfig ( process.cwd (), process.env );
if ( hasErrors ( config ) ) {
  reportErrors ( config );
  process.exit ( 1 );
}
const program = makeProgram ( config, findVersion () );
processProgram ( program, process.argv );





