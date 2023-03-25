import { ErrorsAnd } from "./errors";
import * as fs from "fs";

export function parseFile ( filename: string ): ErrorsAnd<any> {
  const s = fs.readFileSync ( filename, 'utf8' )
  try {
    return JSON.parse ( s )
  } catch ( e ) {
    return [ `Invalid JSON for ${filename}: ${s}` ]
  }
}