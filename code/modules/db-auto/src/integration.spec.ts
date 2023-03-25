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
  it ( "should db-auto ?", async () => {
    const expected = readTestFile ( mockTestDir, 'path.query.expected.txt' );
    expect ( await executeDbAuto ( mockTestDir, `?` ) ).toEqual ( expected );
  } )
  it ( "should db-auto driver", async () => {
    const expected = readTestFile ( mockTestDir, 'path.driver.expected.txt' );
    expect ( await executeDbAuto ( mockTestDir, `driver` ) ).toEqual ( expected );
  } )
  it ( "should db-auto driver.?", async () => {
    const expected = readTestFile ( mockTestDir, 'path.driver.query.expected.txt' );
    expect ( await executeDbAuto ( mockTestDir, `driver.?` ) ).toEqual ( expected );
  } )
  it ( "should db-auto driver.mission", async () => {
    const expected = readTestFile ( mockTestDir, 'path.driver.mission.expected.txt' );
    expect ( await executeDbAuto ( mockTestDir, `driver.mission` ) ).toEqual ( expected );
  } )
  it ( "should db-auto driver.mission.?", async () => {
    const expected = readTestFile ( mockTestDir, 'path.driver.mission.query.expected.txt' );
    expect ( await executeDbAuto ( mockTestDir, `driver.mission.?` ) ).toEqual ( expected );
  } )
} )
