import { processPathString, processPathString2, SqlPP } from "./path";
import { buildPlan, clean, makePathSpec, mergeSelectData, PathSpec, pathToSql, selectData, sqlFor } from "@dbpath/tables";
import { hasErrors, mapErrors, safeArray } from "@dbpath/utils";
import { cleanEnv, EnvAndName } from "@dbpath/environments";
import { sampleMeta, sampleSummary } from "@dbpath/fixtures";
import { parsePath } from "@dbpath/pathparser";
import { DalPathValidator } from "@dbpath/dal";

const envAndName: EnvAndName = { env: cleanEnv.dev, envName: 'dev' };
describe ( 'processPath', () => {
  describe ( 'notfounds', () => {

    it ( 'should handle notfound', async () => {
      expect ( await processPathString ( envAndName, clean, makePathSpec ( 'notfound' ), {} ) ).toEqual ( [
        "Cannot find table notfound in tables. Available tables are: driver,driver_aud,mission,mission_aud"
      ] )
    } )
    it ( 'should handle notfound.?', async () => {
      expect ( await processPathString ( envAndName, clean, makePathSpec ( 'notfound.?' ), {} ) ).toEqual ( [
        "Cannot find table notfound in tables. Available tables are: driver,driver_aud,mission,mission_aud"
      ] )
    } )
    it ( 'should handle driver.notfound.', async () => {
      expect ( await processPathString ( envAndName, clean, makePathSpec ( 'driver.notfound' ), {} ) ).toEqual ( [
        "Cannot find link notfound in table drivertable for path [driver]. Available links are: audit,mission"
      ] )
    } )
    it ( 'should handle driver.notfound.?', async () => {
      expect ( await processPathString ( envAndName, clean, makePathSpec ( 'driver.notfound.?' ), {} ) ).toEqual ( [
        "Cannot find link notfound in table drivertable for path [driver]. Available links are: audit,mission",
      ] )
    } )
    it ( 'should handle driver.mission.notfound.?', async () => {
      expect ( await processPathString ( envAndName, clean, makePathSpec ( 'driver.mission.notfound.?' ), {} ) ).toEqual ( [
        "Cannot find link notfound in table mission for path [driver.mission]. Available links are: driver,mission_aud"
      ] )
    } )
  } )
  describe ( 'links', () => {
    it ( 'should handle ?', async () => {
      expect ( await processPathString ( envAndName, clean, makePathSpec ( '?' ), {} ) )
        .toEqual ( {
          "links": [ "driver", "driver_aud", "mission", "mission_aud" ],
          "type": "links"
        } )
    } )
    it ( 'should handle d?', async () => {
      expect ( await processPathString ( envAndName, clean, makePathSpec ( 'd?' ), {} ) )
        .toEqual ( {
          "links": [ "driver", "driver_aud" ],
          "type": "links"
        } )
    } )
    it ( 'should handle notin?', async () => {
      expect ( await processPathString ( envAndName, clean, makePathSpec ( 'notin?' ), {} ) )
        .toEqual ( {
          "links": [],
          "type": "links"
        } )
    } )
    it ( "should handle driver.?", async () => {
      expect ( await processPathString ( envAndName, clean, makePathSpec ( "driver.?" ), {} ) ).toEqual (
        {
          "links": [ "mission", "audit" ],
          "type": "links"
        }
      )

    } )
    it ( "should handle driver.m?", async () => {
      expect ( await processPathString ( envAndName, clean, makePathSpec ( "driver.m?" ), {} ) ).toEqual (
        {
          "links": [ "mission" ],
          "type": "links"
        }
      )

    } )
    it ( "should handle driver.notin?", async () => {
      expect ( await processPathString ( envAndName, clean, makePathSpec ( "driver.notin?" ), {} ) ).toEqual (
        {
          "links": [],
          "type": "links"
        }
      )
    } )

  } )
  describe ( "returning a plan", () => {
    async function forPlan ( path: string ) {
      const actual = await processPathString ( envAndName, clean, makePathSpec ( path ), { plan: true } )
      const data = mapErrors ( buildPlan ( clean, makePathSpec ( path ) ), selectData ( "all" ) )
      const expected = { type: 'selectData', data }
      return { actual, expected }
    }
    it ( "should handle driver", async () => {
      const { actual, expected } = await forPlan ( "driver" )
      expect ( actual ).toEqual ( expected )
    } )
    it ( "should handle driver.mission", async () => {
      const { actual, expected } = await forPlan ( "driver.mission" )
      expect ( actual ).toEqual ( expected )
      expect ( expected.data ).toEqual ( [
        { "alias": "T0", "columns": [ "*" ], "table": "drivertable", "where": [] },
        { "alias": "T1", "columns": [ "*" ], "table": "mission", "where": [ "T0.driverId = T1.driverId" ] }
      ] )
    } )
    it ( "should handle mission.driver", async () => {
      const { actual, expected } = await forPlan ( "mission.driver" )
      expect ( actual ).toEqual ( expected )
      expect ( expected.data ).toEqual ( [
        { "alias": "T0", "columns": [ "*" ], "table": "mission", "where": [] },
        { "alias": "T1", "columns": [ "*" ], "table": "drivertable", "where": [ "T0.driverId = T1.driverId" ] }
      ] )

    } )
    it ( "should handle driver.mission.driver.audit", async () => {
      const { actual, expected } = await forPlan ( "driver.mission.driver.audit" )
      expect ( actual ).toEqual ( expected )
      expect ( expected.data ).toEqual ( [
        { "alias": "T0", "columns": [ "*" ], "table": "drivertable", "where": [] },
        { "alias": "T1", "columns": [ "*" ], "table": "mission", "where": [ "T0.driverId = T1.driverId" ] },
        { "alias": "T2", "columns": [ "*" ], "table": "drivertable", "where": [ "T1.driverId = T2.driverId" ] },
        { "alias": "T3", "columns": [ "*" ], "table": "driver_aud", "where": [ "T2.driverId = T3.driverId" ] } ] )

    } )

  } )
  describe ( "returning a sql", () => {
    async function forSql ( pathSpec: PathSpec ) {
      const actual = await processPathString2 ( envAndName, clean, pathSpec, { sql: true } )
      let plan = parsePath ( DalPathValidator ( sampleSummary, sampleMeta ) ) ( pathSpec.rawPath );
      if ( hasErrors ( plan ) ) throw plan
      const sql = pathToSql ( {}, plan, pathSpec )
      const expected: SqlPP = { type: 'sql', sql, envName: 'dev' }
      return { actual, expected }
    }
    // async function forSql ( pathSpec: PathSpec ) {
    //   const actual = await processPathString2 ( envAndName, clean, pathSpec, { sql: true } )
    //   const sql = mapErrors ( buildPlan ( clean, pathSpec ), plan =>
    //     sqlFor ( {} ) ( mergeSelectData ( selectData ( "all" ) ( plan ) ) ) )
    //   const expected: SqlPP = { type: 'sql', sql, envName: 'dev' }
    //   return { actual, expected }
    // }

    it ( "should handle driver", async () => {
      const { actual, expected } = await forSql ( makePathSpec ( "driver" ) )
      expect ( actual ).toEqual ( expected )
    } )
    it ( "should handle driver.mission", async () => {
      const { actual, expected } = await forSql ( makePathSpec ( "driver.mission" ) )
      expect ( actual ).toEqual ( expected )
      expect ( expected.sql ).toEqual ( [
        "select T0.*, T1.*",
        "   from drivertable T0, mission T1 where T0.driverid = T1.driverid"
      ] )
    } )
    it ( "should handle driver.mission with ids specified", async () => {
      //where replacing these clean up the pkquery
      const { actual, expected } = await forSql ( makePathSpec ( "driver.mission", sampleMeta.tables, "1" ) )
      expect ( actual ).toEqual ( expected )
      expect ( expected.sql ).toEqual ( [
        "select T0.*, T1.*",
        "   from drivertable T0, mission T1 where T0.driverid=1 and T0.driverid = T1.driverid"
      ] )
    } )
    it ( "should handle driver.mission with a where", async () => {
      const { actual, expected } = await forSql ( makePathSpec ( "driver.mission", sampleMeta.tables, undefined, {}, [ "w1" ] ) )
      expect ( actual ).toEqual ( expected )
      expect ( expected.sql ).toEqual ( [
        "select T0.*, T1.*",
        "   from drivertable T0, mission T1 where w1 and T0.driverid = T1.driverid"
      ])
    } )
    it ( "should handle driver.mission with wheres", async () => {
      const { actual, expected } = await forSql ( makePathSpec ( "driver.mission", sampleMeta.tables, undefined, {}, [ "w1", "w2" ] ) )
      expect ( actual ).toEqual ( expected )
      expect ( expected.sql ).toEqual ([
        "select T0.*, T1.*",
        "   from drivertable T0, mission T1 where w1 and w2 and T0.driverid = T1.driverid"
      ])
    } )
    it ( "should handle driver.mission.driver with wheres", async () => {
      const { actual, expected } = await forSql ( makePathSpec ( "driver.mission.driver", sampleMeta.tables, undefined, {}, [ "w1", "w2" ] ) )
      expect ( actual ).toEqual ( expected )
      expect ( expected.sql ).toEqual ([
        "select T0.*, T1.*",
        "   from drivertable T0, mission T1 where w1 and w2 and T0.driverid = T1.driverid"
      ])
    } )

  } )
} )
