import { executeDbAuto, testRoot } from "./integration.fixture";
import Path from "path";
import { readTestFile } from "@dbpath/files";

const mockTestDir = testRoot + '/malformedConfig';

describe ( "running commands with a malformed config", () => {
  describe ( "when the env doesnt validate", () => {
    it ( "postgres", async () => {
      const dir = Path.join ( mockTestDir, 'envDoesntValidate' );
      const expected = readTestFile ( dir, "postgres.expected.txt" );
      expect ( await executeDbAuto ( dir, `? -e postgres` ) ).toEqual ( expected );
    } )
    it ( "oracle", async () => {
      const dir = Path.join ( mockTestDir, 'envDoesntValidate' );
      const expected = readTestFile ( dir, "oracle.expected.txt" );
      expect ( await executeDbAuto ( dir, `? -e oracle` ) ).toEqual ( expected );
    } )
    it ( "empty", async () => {
      const dir = Path.join ( mockTestDir, 'envDoesntValidate' );
      const expected = readTestFile ( dir, "empty.expected.txt" );
      expect ( await executeDbAuto ( dir, `? -e empty` ) ).toEqual ( expected );
    } )
    it ( "notin", async () => {
      const dir = Path.join ( mockTestDir, 'envDoesntValidate' );
      const expected = readTestFile ( dir, "notin.expected.txt" );
      expect ( await executeDbAuto ( dir, `? -e notin` ) ).toEqual ( expected );
    } )
    it ( "unknown", async () => {
      const dir = Path.join ( mockTestDir, 'envDoesntValidate' );
      const expected = readTestFile ( dir, "unknown.expected.txt" );
      expect ( await executeDbAuto ( dir, `? -e unknown` ) ).toEqual ( expected );
    } )
  } )
} )
