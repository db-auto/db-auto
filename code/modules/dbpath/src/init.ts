import { findDirectoryHoldingFileOrError } from "@dbpath/files";
import { dbPathDir } from "@dbpath/environments";
import { mapErrors } from "@dbpath/utils";
import fs from "fs";
import { configFileName } from "./cli";
import Path from "path";

export const defaultConfig = {
  "comment": {
    passwords: [ "should not be stored here. You can specify them if you have to, but it's better to use environment variables.",
      "    use  DBPATH_<environment name>_PASSWORD" ]
  },
  "environments": {
    "samplepostgressThatWontWorkForYou": { "type": "postgres", "host": "localhost", "port": 5432, "database": "postgres", "schema": "public", "username": "phil"},
    "sampleoracleThatWontWorkForYou": { "type": "oracle", "connection": "localhost/xepdb1", "schema": "PHIL", "username": "phil" }
  },
  "summary": {
    "comment": "You can give short or meaningful names to tables and views here",
    "tables": {
      "sampleShortName": { "tableName": "Put here the full name" }
    }
  }
}

export function initConfig ( cwd: string ) {
  return mapErrors ( findDirectoryHoldingFileOrError ( cwd, dbPathDir ), dir => {
    let filename = Path.join ( dir, dbPathDir, configFileName );
    fs.writeFileSync ( filename, JSON.stringify ( defaultConfig, null, 2 ) )
    return filename
  } )
}