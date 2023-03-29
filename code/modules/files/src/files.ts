import path from "path";
import fs from "fs";
import * as Path from "path";
import { cleanLineEndings, ErrorsAnd, hasErrors, mapErrors } from "@dbpath/utils";

export function findInParent ( directory: string, acceptor: ( filename: string ) => boolean ): string | undefined {
  function find ( dir: string ): string {
    if ( acceptor ( dir ) ) return dir
    let parse = path.parse ( dir )
    if ( parse.dir === parse.root ) return undefined
    return find ( parse.dir )
  }
  return find ( directory )
}
export function findDirectoryHoldingFileOrError ( directory: string, file: string ): ErrorsAnd<string> {
  const dir = findInParent ( directory, dir => fs.existsSync ( Path.join ( dir, file ) ) )
  if ( dir === undefined ) return [ `Cannot find ${file}. Started looking in ${directory}` ]
  return dir
}
export function loadFileInDirectory ( cwd: string, marker: string, filename: string ) {
  const dir = findDirectoryHoldingFileOrError ( cwd, marker )
  if ( hasErrors ( dir ) ) return dir
  const file = Path.join ( dir, marker, filename )
  try {
    const contents = fs.readFileSync ( file ).toString ( 'utf-8' )
    try {
      return JSON.parse ( contents )
    } catch ( e ) {
      return [ `Error parsing ${file}: ${e.message}` ]
    }
  } catch ( e ) {
    return [ `Error reading ${file}: ${e.message}` ]
  }

}

export function findDirectoryHoldingFileOrThrow ( directory: string, file: string ): string {
  const dir = findDirectoryHoldingFileOrError ( directory, file )
  if ( hasErrors ( dir ) ) throw dir;
  return dir;
}
export function findFileInParentsOrError ( directory: string, file: string ): ErrorsAnd<string> {
  return mapErrors ( findDirectoryHoldingFileOrError ( directory, file ), dir => Path.join ( dir, file ) );
}
export function readTestFile ( dir, file: string ) {
  return cleanLineEndings ( fs.readFileSync ( Path.join ( dir, file ), 'utf8' ) )
}