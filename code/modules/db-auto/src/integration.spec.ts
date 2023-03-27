import { executeDbAuto, testRoot } from "./integration.fixture";
import { readTestFile } from "@db-auto/files";


const mockTestDir = testRoot + '/simple';

const inCi = process.env[ 'CI' ] === 'true'
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
    it ( "should db-auto driver.mission --fullSql", async () => {
      const expected = readTestFile ( mockTestDir, 'path.driver.mission.fullSql.expected.txt' );
      expect ( await executeDbAuto ( mockTestDir, `driver.mission --fullSql --page 2 --pageSize 3` ) ).toEqual ( expected );
    } )

    it ("should db-auto driver.mission --count", async () => {
      const expected = readTestFile ( mockTestDir, 'path.driver.mission.count.expected.txt' );
      expect ( await executeDbAuto ( mockTestDir, `driver.mission --count` ) ).toEqual ( expected );

    })
    it ("should db-auto driver.mission --distinct", async () => {
      const expected = readTestFile ( mockTestDir, 'path.driver.mission.distinct.expected.txt' );
      expect ( await executeDbAuto ( mockTestDir, `driver.mission --distinct --sql` ) ).toEqual ( expected );

    })

  } )
  describe ( "execution", () => {
    it ( "should db-auto driver ", async () => {
      if ( inCi ) return
      const expected = readTestFile ( mockTestDir, 'path.driver.expected.txt' );
      expect ( await executeDbAuto ( mockTestDir, `driver ` ) ).toEqual ( expected );
    } )
    it ( "should db-auto driver.mission ", async () => {
      if ( inCi ) return
      const expected = readTestFile ( mockTestDir, 'path.driver.mission.expected.txt' );
      expect ( await executeDbAuto ( mockTestDir, `driver.mission` ) ).toEqual ( expected );
    } )
    it ( "should db-auto driver.mission with json output", async () => {
      if ( inCi ) return
      const expected = readTestFile ( mockTestDir, 'path.driver.mission.expected.json' );
      expect ( await executeDbAuto ( mockTestDir, `driver.mission --json` ) ).toEqual ( expected );
    } )
    it ( "should db-auto driver.mission with no titles", async () => {
      if ( inCi ) return
      const expected = readTestFile ( mockTestDir, 'path.driver.mission.notitles.expected.txt' );
      expect ( await executeDbAuto ( mockTestDir, `driver.mission --notitles` ) ).toEqual ( expected );
    } )
    it ( "should db-auto driver.audit with oneline json output", async () => {
      if ( inCi ) return
      const expected = readTestFile ( mockTestDir, 'path.driver.audit.expected.oneline.json' );
      expect ( await executeDbAuto ( mockTestDir, `driver.audit --onelinejson` ) ).toEqual ( expected );
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

describe("scraping", () => {
  it("should scrape", async () => {
    const expected = readTestFile(mockTestDir, 'scrape.expected.txt');
    expect(await executeDbAuto(mockTestDir, `scrape`)).toEqual(expected);
  })
})

describe("status", () =>{
  it("should return status", async () => {
    const expected = readTestFile(mockTestDir, 'status.expected.txt');
    expect(await executeDbAuto(mockTestDir, `status`)).toEqual(expected);
  })
})