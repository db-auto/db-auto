import { findDirectoryHoldingFileOrError } from "@dbpath/files";
import { dbPathDir } from "@dbpath/environments";
import { mapErrors } from "@dbpath/utils";
import fs from "fs";
import { configFileName } from "./cli";
import Path from "path";

export const defaultConfig = {
  "comment": {
    passwords: [ "should not be stored here. You can specify them if you have to, but it's better to use environment variables.",
      "    use  DBPATH_<environment name>_PASSWORD" ],
    gettingGoing: [ "Once you have created environments, you can use dbpath to run queries against them.",
      "   you need to select the environment using dbpath admin env <environment name>",
      "   and then you need to scrape the database using dbpath metadata refresh" ],
    "summary": [
      "dbpath admin init",
      "... edit this config file to tell dbpath about your databases",
      "dbpath admin env <environment name>",
      "dbpath metadata refresh",
      "  ... and you are good to go!"
    ]
  },
  "environments": {
    "samplepostgressThatWontWorkForYou": {
      "type": "postgres", "host": "localhost", "port": 5432, "database": "postgres", "schema": "public",
      "username": "phil", password: "you can set them here but it's better to use environment variables"
    },
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
  let filename = Path.join ( dbPathDir, configFileName );
  fs.mkdirSync ( dbPathDir, { recursive: true } )
  fs.writeFileSync ( filename, JSON.stringify ( defaultConfig, null, 2 ) )
  return filename
}