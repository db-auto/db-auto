import { DatabaseMetaData } from "@dbpath/dal";
import { ErrorsAnd, mapErrors } from "@dbpath/utils";
import { findDirectoryHoldingFileOrError, loadFileInDirectory } from "@dbpath/files";
import { dbPathDir } from "@dbpath/environments";
import Path from "path";
import fs from "fs";

const metadataFileName = 'metadata.json'
export const metadataDirectory = ( cwd: string, env: string ): ErrorsAnd<string> =>
  findDirectoryHoldingFileOrError ( cwd, dbPathDir );
export const metadataFile = ( cwd: string, env: string ): ErrorsAnd<string> =>
  mapErrors ( metadataDirectory ( cwd, env ), dir => Path.join ( dir, 'metadata.json' ) );

export function saveMetadata ( cwd: string, envName: string, meta: DatabaseMetaData ): ErrorsAnd<any> {
  return mapErrors ( metadataDirectory ( cwd, envName ), async directory => {
    try {
      fs.mkdirSync ( directory, { recursive: true } )
      const filename = Path.join ( directory, metadataFileName )
      fs.writeFileSync ( filename, JSON.stringify ( meta, null, 2 ) );
      return null
    } catch ( e ) {
      return [ `Unexpected error saving metadata ${e}` ]
    }
  } )
}

export const loadMetadata = ( cwd: string, envName: string ) =>
  loadFileInDirectory ( cwd, 'metadata', Path.join ( dbPathDir, envName ), metadataFileName );

