//Copyright (c)2020-2023 Philip Rice. <br />Permission is hereby granted, free of charge, to any person obtaining a copyof this software and associated documentation files (the Software), to dealin the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:  <br />The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED AS
import path from "path";
import { Writable } from "stream";
import { findDirectoryHoldingFileOrThrow } from "@db-auto/files";
import cp from "child_process";
import Path from "path";
import { cleanLineEndings } from "@db-auto/utils";


export const codeRootDir = findDirectoryHoldingFileOrThrow ( process.cwd (), "laoban.json" );
export const testRoot = path.resolve ( codeRootDir, '..', 'tests' );
export const codePath = Path.resolve ( codeRootDir, "modules/db-auto/dist/index.js" )


export function executeDbAuto ( cwd: string, cmd: string ): Promise<string> {
  let fullCmd = `node ${codePath} ${cmd}`;
  // console.log ( 'executeDbAuto', cwd, fullCmd )
  return execute ( cwd, fullCmd )
}
export function execute ( cwd: string, cmd: string ): Promise<string> {
  // console.log('execute', cwd, cmd)
  return new Promise<string> ( resolve => {
    cp.exec ( cmd, { cwd, env: process.env }, ( error, stdout, stdErr ) => {
      resolve ( cleanLineEndings ( stdout.toString () + (stdErr.length > 0 ? "\n" + stdErr : '') ).toString () )
    } )
  } )
}

export function toArrayReplacingRoot ( testRoot: string, s: string ): string[] {
  let rootMatch = new RegExp ( testRoot.replace ( /\\/g, "/" ), "g" )
  return s.split ( '\n' ).map ( s => s.replace ( /\\/g, "/" ).trim () )
    .map ( s => s.replace ( rootMatch, "<root>" ) ).filter ( s => s.length > 0 )
}

