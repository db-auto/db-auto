import { executeDbAuto, inCi, testRoot } from "./integration.fixture";
import fs, { promises } from "fs";
import { readTestFile } from "@dbpath/files";
import Path from "path";
import { dbPathDir, stateFileName } from "@dbpath/environments";
import { defaultConfig } from "./init";
import { cleanLineEndings } from "@dbpath/utils";


// jest.setTimeout ( 10000 );

const mockTestDir = testRoot + '/simple';


beforeEach ( async () => {
  const p = ( s: string ) => Path.join ( mockTestDir, dbPathDir, s )
  const sp = ( s: string ) => Path.join ( mockTestDir, 'start', s )
  const cp = async ( s: string ) => promises.copyFile ( sp ( s ), p ( s ) )
  await promises.rm ( p ( '.' ), { force: true, recursive: true } )
  await promises.mkdir ( p ( './dev' ), { recursive: true } )
  await promises.mkdir ( p ( './oracle' ), { recursive: true } )
  await cp ( 'dbpath.config.json' )
  await cp ( 'dev/metadata.json' )
  await cp ( 'oracle/metadata.json' )
} )
describe ( "dbpath envs", () => {
  it ( "should display the envs", async () => {
    const expected = readTestFile ( mockTestDir, 'envs.expected.txt' );
    expect ( await executeDbAuto ( mockTestDir, `admin envs` ) ).toEqual ( expected );
  } )
} )

describe ( "dbpath env", () => {
  it ( "should set the env and it should be visible in envs", async () => {
    await promises.rm ( Path.join ( mockTestDir, dbPathDir, stateFileName ), { force: true } )
    const expectedOracleEnv = readTestFile ( mockTestDir, 'env.oracle.expected.txt' );
    const expectedDevEnv = readTestFile ( mockTestDir, 'env.dev.expected.txt' );
    expect ( await executeDbAuto ( mockTestDir, `admin envs` ) ).toContain ( "Current environment is dev" ); //default
    expect ( await executeDbAuto ( mockTestDir, `admin env oracle` ) ).toEqual ( expectedOracleEnv );
    expect ( await executeDbAuto ( mockTestDir, `admin envs` ) ).toContain ( "Current environment is oracle" );
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
  describe ( "exceptions", () => {
    it ( "should handle a missing fk", async () => {
      const expected = readTestFile ( mockTestDir, 'path.driver.mission_aud.missingfk.expected.txt' );
      expect ( await executeDbAuto ( mockTestDir, `driver.mission_aud` ) ).toEqual ( expected );
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

  it ( "should build up the results - execution with oracle", async () => {
    if ( inCi ) return
    await executeDbAuto ( mockTestDir, `admin env oracle` )
    const expected = readTestFile ( mockTestDir, 'trace.execution.oracle.expected.txt' );
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

describe ( "metadata", () => {
  it ( "should dbpath metadata live", async () => {
    const expected = readTestFile ( mockTestDir, "metadata.live.dev.expected.txt" );
    expect ( await executeDbAuto ( mockTestDir, "metadata live " ) ).toEqual ( expected );
  } );
  it ( "should dbpath metadata live oracle", async () => {
    const expected = readTestFile ( mockTestDir, "metadata.live.oracle.expected.txt" );
    expect ( await executeDbAuto ( mockTestDir, "metadata live oracle" ) ).toEqual ( expected );
  } );

  it ( "should dbpath metadata show when none is available", async () => {
    await promises.rm ( Path.join ( mockTestDir, dbPathDir, 'dev' ), { force: true, recursive: true } )
    await promises.rm ( Path.join ( mockTestDir, dbPathDir, 'oracle' ), { force: true, recursive: true } )
    const expected = readTestFile ( mockTestDir, "metadata.show.nodata.expected.txt" );
    expect ( await executeDbAuto ( mockTestDir, "metadata show" ) ).toEqual ( expected );
  } )
  it ( "should dbpath metadata refresh then show for postgres", async () => {
    await promises.rm ( Path.join ( mockTestDir, dbPathDir, 'dev' ), { force: true, recursive: true } )
    const expectedRefresh = readTestFile ( mockTestDir, "metadata.refresh.postgres.expected.txt" );
    const expectedShow = readTestFile ( mockTestDir, "metadata.refreshThenShow.postgres.expected.txt" );
    expect ( await executeDbAuto ( mockTestDir, "metadata refresh" ) ).toEqual ( expectedRefresh );
    expect ( await executeDbAuto ( mockTestDir, "metadata show" ) ).toEqual ( expectedShow );

    expect ( fs.existsSync ( Path.join ( mockTestDir, dbPathDir, 'dev' ) ) ).toBe ( true )
  } )
  it ( "should dbpath metadata refresh then show for oracle", async () => {
    await promises.rm ( Path.join ( mockTestDir, dbPathDir, 'oracle' ), { force: true, recursive: true } )
    const expectedRefresh = readTestFile ( mockTestDir, "metadata.refresh.oracle.expected.txt" );
    const expectedShow = readTestFile ( mockTestDir, "metadata.refreshThenShow.oracle.expected.txt" );
    expect ( await executeDbAuto ( mockTestDir, "metadata refresh  oracle" ) ).toEqual ( expectedRefresh );
    expect ( await executeDbAuto ( mockTestDir, "metadata show oracle" ) ).toEqual ( expectedShow );
    expect ( fs.existsSync ( Path.join ( mockTestDir, dbPathDir, 'oracle' ) ) ).toBe ( true )
  } )

} )

describe ( "admin init", () => {
  it ( "should give a warning if the dbpath is not empty", async () => {
    const expected = readTestFile ( mockTestDir, "admin.init.notempty.expected.txt" );
    expect ( await executeDbAuto ( mockTestDir, "admin init" ) ).toEqual ( expected );
    expect ( readTestFile ( mockTestDir, ".dbpath/dbpath.config.json" ) ).toEqual ( readTestFile ( mockTestDir, "start/dbpath.config.json" ) )
  } )

  it ( "should init if --force is specified", async () => {
    const expected = readTestFile ( mockTestDir, "admin.init.forced.expected.txt" );
    const expectedDbInit = readTestFile ( mockTestDir, "admin.init.dbconfig.expected.txt" );
    expect ( await executeDbAuto ( mockTestDir, "admin init --force" ) ).toEqual ( expected );
    expect ( readTestFile ( mockTestDir, ".dbpath/dbpath.config.json" ) ).toEqual ( expectedDbInit )
  } )
} )