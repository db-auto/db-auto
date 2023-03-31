import { executeDbAuto, testRoot } from "./integration.fixture";
import { promises } from "fs";
import { readTestFile } from "@dbpath/files";
import Path from "path";
import { dbPathDir, stateFileName } from "@dbpath/environments";

// jest.setTimeout ( 10000 );

const mockTestDir = testRoot + '/simple';

const inCi = process.env[ 'CI' ] === 'true'

describe ( "dbpath envs", () => {
  it ( "should display the envs", async () => {
    const expected = readTestFile ( mockTestDir, 'envs.expected.txt' );
    expect ( await executeDbAuto ( mockTestDir, `admin envs` ) ).toEqual ( expected );
  } )
} )

describe ( "dbpath env", () => {
  it ( "should set the env and it should be visible in envs", async () => {
    await promises.rm ( Path.join ( mockTestDir, dbPathDir, stateFileName ), { force: true } )
    const expectedTestEnv = readTestFile ( mockTestDir, 'env.test.expected.txt' );
    const expectedDevEnv = readTestFile ( mockTestDir, 'env.dev.expected.txt' );
    expect ( await executeDbAuto ( mockTestDir, `admin envs` ) ).toContain ( "Current environment is dev" ); //default
    expect ( await executeDbAuto ( mockTestDir, `admin env test` ) ).toEqual ( expectedTestEnv );
    expect ( await executeDbAuto ( mockTestDir, `admin envs` ) ).toContain ( "Current environment is test" );
    expect ( await executeDbAuto ( mockTestDir, `admin env dev` ) ).toEqual ( expectedDevEnv );
    expect ( await executeDbAuto ( mockTestDir, `admin envs` ) ).toContain ( "Current environment is dev" );
    await promises.rm ( Path.join ( mockTestDir, dbPathDir, stateFileName ), { force: true } )
  } )

} )

describe ( "dbpath paths", () => {
  describe ( "with ?", () => {

    it ( "should dbpath ?", async () => {
      const expected = readTestFile ( mockTestDir, 'path.query.expected.txt' );
      expect ( await executeDbAuto ( mockTestDir, `?` ) ).toEqual ( expected );
    } )
    it ( "should dbpath driver.?", async () => {
      const expected = readTestFile ( mockTestDir, 'path.driver.query.expected.txt' );
      expect ( await executeDbAuto ( mockTestDir, `driver.?` ) ).toEqual ( expected );
    } )
    it ( "should dbpath driver.m?", async () => {
      const expected = readTestFile ( mockTestDir, 'path.driver.mquery.expected.txt' );
      expect ( await executeDbAuto ( mockTestDir, `driver.m?` ) ).toEqual ( expected );
    } )
    it ( "should dbpath driver.mission.?", async () => {
      const expected = readTestFile ( mockTestDir, 'path.driver.mission.query.expected.txt' );
      expect ( await executeDbAuto ( mockTestDir, `driver.mission.?` ) ).toEqual ( expected );
    } )
  } )
  describe ( "sql", () => {
    it ( "should dbpath driver -s", async () => {
      const expected = readTestFile ( mockTestDir, 'path.driver.sql.expected.txt' );
      expect ( await executeDbAuto ( mockTestDir, `driver -s` ) ).toEqual ( expected );
    } )
    it ( "should dbpath driver.mission --sql", async () => {
      const expected = readTestFile ( mockTestDir, 'path.driver.mission.sql.expected.txt' );
      expect ( await executeDbAuto ( mockTestDir, `driver.mission --sql` ) ).toEqual ( expected );
    } )
    it ( "should dbpath driver.mission --fullSql", async () => {
      const expected = readTestFile ( mockTestDir, 'path.driver.mission.fullSql.expected.txt' );
      expect ( await executeDbAuto ( mockTestDir, `driver.mission --fullSql --page 2 --pageSize 3` ) ).toEqual ( expected );
    } )

    it ( "should dbpath driver.mission --count", async () => {
      const expected = readTestFile ( mockTestDir, 'path.driver.mission.count.expected.txt' );
      expect ( await executeDbAuto ( mockTestDir, `driver.mission --count` ) ).toEqual ( expected );

    } )
    it ( "should dbpath driver.mission --distinct", async () => {
      const expected = readTestFile ( mockTestDir, 'path.driver.mission.distinct.expected.txt' );
      expect ( await executeDbAuto ( mockTestDir, `driver.mission --distinct --sql` ) ).toEqual ( expected );

    } )

  } )
  describe ( "execution", () => {
    it ( "should dbpath driver ", async () => {
      if ( inCi ) return
      const expected = readTestFile ( mockTestDir, 'path.driver.expected.txt' );
      expect ( await executeDbAuto ( mockTestDir, `driver ` ) ).toEqual ( expected );
    } )
    it ( "should dbpath driver.mission ", async () => {
      if ( inCi ) return
      const expected = readTestFile ( mockTestDir, 'path.driver.mission.expected.txt' );
      expect ( await executeDbAuto ( mockTestDir, `driver.mission` ) ).toEqual ( expected );
    } )
    it ( "should dbpath driver.mission with json output", async () => {
      if ( inCi ) return
      const expected = readTestFile ( mockTestDir, 'path.driver.mission.expected.json' );
      expect ( await executeDbAuto ( mockTestDir, `driver.mission --json` ) ).toEqual ( expected );
    } )
    it ( "should dbpath driver.mission with no titles", async () => {
      if ( inCi ) return
      const expected = readTestFile ( mockTestDir, 'path.driver.mission.notitles.expected.txt' );
      expect ( await executeDbAuto ( mockTestDir, `driver.mission --notitles` ) ).toEqual ( expected );
    } )
    it ( "should dbpath driver.audit with oneline json output", async () => {
      if ( inCi ) return
      const expected = readTestFile ( mockTestDir, 'path.driver.audit.expected.oneline.json' );
      expect ( await executeDbAuto ( mockTestDir, `driver.audit --onelinejson` ) ).toEqual ( expected );
    } )

  } )
} )

describe ( 'dbpath path id', () => {
  it ( "should dbpath driver did --s", async () => {
    const expected = readTestFile ( mockTestDir, 'pathWithId.driver.123.expected.txt' );
    expect ( await executeDbAuto ( mockTestDir, `driver 123 -s` ) ).toEqual ( expected );

  } )
} )

describe ( 'dbpath path --help', () => {
  it ( "should have a --help", async () => {
    const expected = readTestFile ( mockTestDir, 'help.expected.txt' );
    expect ( await executeDbAuto ( mockTestDir, `--help` ) ).toEqual ( expected );

  } )
} )


describe ( "dbpath trace", () => {
  it ( "should build up the results - sql", async () => {
    const expected = readTestFile ( mockTestDir, 'trace.sql.expected.txt' );
    expect ( await executeDbAuto ( mockTestDir, `driver.mission.driver.audit -ts` ) ).toEqual ( expected );
  } )

  it ( "should build up the results - execution", async () => {
    if ( inCi ) return
    const expected = readTestFile ( mockTestDir, 'trace.execution.expected.txt' );
    expect ( await executeDbAuto ( mockTestDir, `driver.mission.driver.audit -t` ) ).toEqual ( expected );
  } )
} )

describe ( "scraping", () => {
  it ( "should scrape", async () => {
    const expected = readTestFile ( mockTestDir, 'scrape.expected.txt' );
    expect ( await executeDbAuto ( mockTestDir, `metadata live` ) ).toEqual ( expected );
  } )
} )

describe ( "status", () => {
  it ( "should return status", async () => {
    const expected = readTestFile ( mockTestDir, 'status.expected.txt' );
    expect ( await executeDbAuto ( mockTestDir, `admin status` ) ).toEqual ( expected );
  } )
} )