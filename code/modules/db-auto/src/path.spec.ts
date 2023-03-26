import { processPathString, SqlPP } from "./path";
import { buildPlan, clean, makePathSpec, mergeSelectData, PathSpec, selectData, sqlFor } from "@db-auto/tables";
import { mapErrors } from "@db-auto/utils";
import { cleanEnv, EnvAndName } from "@db-auto/environments";

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
        "Cannot find link notfound in table DriverTable for path [driver]. Available links are: audit,mission"
      ] )
    } )
    it ( 'should handle driver.notfound.?', async () => {
      expect ( await processPathString ( envAndName, clean, makePathSpec ( 'driver.notfound.?' ), {} ) ).toEqual ( [
        "Cannot find link notfound in table DriverTable for path [driver]. Available links are: audit,mission",
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
        { "alias": "T0", "columns": [ "*" ], "table": "DriverTable", "where": [] },
        { "alias": "T1", "columns": [ "*" ], "table": "mission", "where": [ "T0.driverId = T1.driverId" ] }
      ] )
    } )

  } )
  describe ( "returning a sql", () => {
    async function forSql ( pathSpec: PathSpec ) {
      const actual = await processPathString ( envAndName, clean, pathSpec, { sql: true } )
      const sql = mapErrors ( buildPlan ( clean, pathSpec ), plan =>
        sqlFor ( {} ) ( mergeSelectData ( selectData ( "all" ) ( plan ) ) ) )
      const expected: SqlPP = { type: 'sql', sql, envName: 'dev' }
      return { actual, expected }
    }
    it ( "should handle driver", async () => {
      const { actual, expected } = await forSql ( makePathSpec ( "driver" ) )
      expect ( actual ).toEqual ( expected )
    } )
    it ( "should handle driver.mission", async () => {
      const { actual, expected } = await forSql ( makePathSpec ( "driver.mission" ) )
      expect ( actual ).toEqual ( expected )
      expect ( expected.sql ).toEqual ( [
        "select T0.*, T1.*",
        "   from DriverTable T0, mission T1 where T0.driverId = T1.driverId"
      ] )
    } )
    it ( "should handle driver.mission with a query param and where", async () => {
      const { actual, expected } = await forSql ( makePathSpec ( "driver.mission", undefined, {}, [ "w1" ] ) )
      expect ( actual ).toEqual ( expected )
      expect ( expected.sql ).toEqual ( [
        "select T0.*, T1.*",
        "   from DriverTable T0, mission T1 where w1 and T0.driverId = T1.driverId"
      ] )
    } )
    it ( "should handle driver.mission with a query param and wheres", async () => {
      const { actual, expected } = await forSql ( makePathSpec ( "driver.mission", undefined, {}, [ "w1", "w2" ] ) )
      expect ( actual ).toEqual ( expected )
      expect ( expected.sql ).toEqual ( [
        "select T0.*, T1.*",
        "   from DriverTable T0, mission T1 where w1 and w2 and T0.driverId = T1.driverId"
      ] )
    } )
    it ( "should handle driver.mission with a query param and wheres and a queryparam in driver and mission", async () => {
      const { actual, expected } = await forSql ( makePathSpec ( "driver.mission", undefined, { employeeNum: "123", "date": "thedate" }, [ "w1", "w2" ] ) )
      expect ( actual ).toEqual ( expected )
      expect ( expected.sql ).toEqual ( [
        "select T0.*, T1.*",
        "   from DriverTable T0, mission T1 where w1 and w2 and T0.employeeNum='123' and T1.date='thedate' and T0.driverId = T1.driverId"
      ] )
    } )
  } )
} )
