import { executeDbAuto, testRoot } from "./integration.fixture";
import Path from "path";
import { dbPathDir } from "@dbpath/environments";
import { promises } from "fs";
import { readTestFile } from "@dbpath/files";

const mockTestDir = testRoot + '/empty';

beforeEach ( async () => {
  const p = ( s: string ) => Path.join ( mockTestDir, dbPathDir, s )
} )
const expected = readTestFile ( mockTestDir, 'expected.txt' );
describe ( "the behaviour of dbpath when it is misconfigured", () => {

  describe ( "the behaviour when there are no .dbpath files", () => {
    describe ( "paths", () => {
      it ( "should report an issue with ?", async () => {
        expect ( await executeDbAuto ( mockTestDir, `?` ) ).toEqual ( expected );
      } )
      it ( "should report an issue with drivertable.m?", async () => {
        expect ( await executeDbAuto ( mockTestDir, `drivertable.m?` ) ).toEqual ( expected );
      } )
    } )
    describe ( "paths", () => {
      it ( "should give a nice message when there is no .dbpath file", async () => {
        expect ( await executeDbAuto ( mockTestDir, `driver` ) ).toEqual ( expected );
      } )
    } )
    describe ( "admin/environments", () => {
      it ( "admin envs should give a nice message when there is no .dbpath file", async () => {
        expect ( await executeDbAuto ( mockTestDir, `admin envs` ) ).toEqual ( expected );
      } )
      it ( "admin env oracle should give a nice message when there is no .dbpath file", async () => {
        expect ( await executeDbAuto ( mockTestDir, `admin envs` ) ).toEqual ( expected );
      } )
    } )
    describe ( "metadata", () => {
      it ( "admin metadata show should give a nice message when there is no .dbpath file", async () => {
        expect ( await executeDbAuto ( mockTestDir, `metadata show` ) ).toEqual ( expected );
      } )
      it ( "admin metadata live should give a nice message when there is no .dbpath file", async () => {
        expect ( await executeDbAuto ( mockTestDir, `metadata live` ) ).toEqual ( expected );
      } )
      it ( "admin metadata refresh should give a nice message when there is no .dbpath file", async () => {
        expect ( await executeDbAuto ( mockTestDir, `metadata refresh` ) ).toEqual ( expected );
      } )
      it ( "admin metadata status should give a nice message when there is no .dbpath file", async () => {
        expect ( await executeDbAuto ( mockTestDir, `metadata status` ) ).toEqual ( expected );
      } )
    } )

  } )
} )