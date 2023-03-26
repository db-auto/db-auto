import { executeDbAuto, testRoot } from "./integration.fixture";
import { readTestFile } from "@db-auto/files";


const mockTestDir = testRoot + '/simple';

describe ( "db-auto  makeMocks", () => {
  it ( "should make mocks", async () => {
    const expected = readTestFile ( mockTestDir, 'makeMocks.expected.txt' );
    expect ( await executeDbAuto ( mockTestDir, `mocks` ) ).toEqual ( expected );
  } );
} )

describe ( "db-auto tables", () => {
  it ( "should display tables", async () => {
    const expected = readTestFile ( mockTestDir, 'tables.expected.txt' );
    expect ( await executeDbAuto ( mockTestDir, `tables` ) ).toEqual ( expected );
  } )
} )

describe ( "db-auto envs", () => {
  it ( "should display the envs", async () => {
    const expected = readTestFile ( mockTestDir, 'envs.expected.txt' );
    expect ( await executeDbAuto ( mockTestDir, `envs` ) ).toEqual ( expected );
  } )
} )

describe ( "db-auto paths", () => {
  describe ( "with ?", () => {

    it ( "should db-auto ?", async () => {
      const expected = readTestFile ( mockTestDir, 'path.query.expected.txt' );
      expect ( await executeDbAuto ( mockTestDir, `?` ) ).toEqual ( expected );
    } )
    it ( "should db-auto driver.?", async () => {
      const expected = readTestFile ( mockTestDir, 'path.driver.query.expected.txt' );
      expect ( await executeDbAuto ( mockTestDir, `driver.?` ) ).toEqual ( expected );
    } )
    it ( "should db-auto driver.mission.?", async () => {
      const expected = readTestFile ( mockTestDir, 'path.driver.mission.query.expected.txt' );
      expect ( await executeDbAuto ( mockTestDir, `driver.mission.?` ) ).toEqual ( expected );
    } )
  } )
  describe ( "sql", () => {
    it ( "should db-auto driver -s", async () => {
      const expected = readTestFile ( mockTestDir, 'path.driver.sql.expected.txt' );
      expect ( await executeDbAuto ( mockTestDir, `driver -s` ) ).toEqual ( expected );
    } )
    it ( "should db-auto driver.mission --sql", async () => {
      const expected = readTestFile ( mockTestDir, 'path.driver.mission.sql.expected.txt' );
      expect ( await executeDbAuto ( mockTestDir, `driver.mission --sql` ) ).toEqual ( expected );
    } )
  } )
  describe ( "execution", () => {
    it ( "should db-auto driver ", async () => {
      const expected = readTestFile ( mockTestDir, 'path.driver.expected.txt' );
      expect ( await executeDbAuto ( mockTestDir, `driver ` ) ).toEqual ( expected );
    } )
    it ( "should db-auto driver.mission ", async () => {
      const expected = readTestFile ( mockTestDir, 'path.driver.mission.expected.txt' );
      expect ( await executeDbAuto ( mockTestDir, `driver.mission` ) ).toEqual ( expected );
    } )
  } )
} )

describe ( 'db-auto path id', () => {
  it ( "should db-auto driver did --s", async () => {
    const expected = readTestFile ( mockTestDir, 'pathWithId.driver.123.expected.txt' );
    expect ( await executeDbAuto ( mockTestDir, `driver 123 -s` ) ).toEqual ( expected );

  } )
} )

describe ( 'db-auto path --help', () => {
  it ( "should include the queries as options", async () => {
    const expected = readTestFile ( mockTestDir, 'help.expected.txt' );
    expect ( await executeDbAuto ( mockTestDir, `--help` ) ).toEqual ( expected );

  } )
} )
describe ( 'db-auto path --options that are query params', () => {
  it ( "should db-auto driver --name fred --sql", async () => {
    const expected = readTestFile ( mockTestDir, 'pathWithQueryParams.driver.name.fred.expected.txt' );
    expect ( await executeDbAuto ( mockTestDir, `driver --name fred --sql` ) ).toEqual ( expected );
  } )
} )

describe ( "db-auto trace", () => {
  it ( "should build up the results", async () => {
    const expected = readTestFile ( mockTestDir, 'trace.expected.txt' );
    expect ( await executeDbAuto ( mockTestDir, `driver.mission.driver.audit -ts` ) ).toEqual ( expected );
  } )
} )