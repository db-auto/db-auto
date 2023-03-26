import { processPathString } from "./path";
import { buildPlan, clean, mergeSelectData, selectData, selectDataForOne, sqlFor } from "@db-auto/tables";
import { mapErrors, NameAnd } from "@db-auto/utils";


describe ( 'processPath', () => {
  describe ( 'notfounds', () => {

    it ( 'should handle notfound', () => {
      expect ( processPathString ( clean, 'notfound', undefined, {}, true, undefined ) ).toEqual ( [
        "Cannot find table notfound in tables. Available tables are: driver,driver_aud,mission,mission_aud"
      ] )
    } )
    it ( 'should handle notfound.?', () => {
      expect ( processPathString ( clean, 'notfound.?', undefined, {}, true, undefined ) ).toEqual ( [
        "Cannot find table notfound in tables. Available tables are: driver,driver_aud,mission,mission_aud"
      ] )
    } )
    it ( 'should handle driver.notfound.', () => {
      expect ( processPathString ( clean, 'driver.notfound', undefined, {}, true, undefined ) ).toEqual ( [
        "Cannot find link notfound in table DriverTable for path [driver]. Available links are: audit,mission"
      ] )
    } )
    it ( 'should handle driver.notfound.?', () => {
      expect ( processPathString ( clean, 'driver.notfound.?', undefined, {}, true, undefined ) ).toEqual ( [
        "Cannot find link notfound in table DriverTable for path [driver]. Available links are: audit,mission",
      ] )
    } )
    it ( 'should handle driver.mission.notfound.?', () => {
      expect ( processPathString ( clean, 'driver.mission.notfound.?', undefined, {}, true, undefined ) ).toEqual ( [
        "Cannot find link notfound in table mission for path [driver.mission]. Available links are: driver,mission_aud"
      ] )
    } )
  } )
  describe ( 'links', () => {
    it ( 'should handle ?', () => {
      expect ( processPathString ( clean, '?', undefined, {}, true, undefined ) )
        .toEqual ( {
          "links": [ "driver", "driver_aud", "mission", "mission_aud" ],
          "type": "links"
        } )
    } )
    it ( 'should handle d?', () => {
      expect ( processPathString ( clean, 'd?', undefined, {}, true, undefined ) )
        .toEqual ( {
          "links": [ "driver", "driver_aud" ],
          "type": "links"
        } )
    } )
    it ( 'should handle notin?', () => {
      expect ( processPathString ( clean, 'notin?', undefined, {}, true, undefined ) )
        .toEqual ( {
          "links": [],
          "type": "links"
        } )
    } )
    it ( "should handle driver.?", () => {
      expect ( processPathString ( clean, "driver.?", undefined, {}, true, undefined ) ).toEqual (
        {
          "links": [ "mission", "audit" ],
          "type": "links"
        }
      )

    } )
    it ( "should handle driver.m?", () => {
      expect ( processPathString ( clean, "driver.m?", undefined, {}, true, undefined ) ).toEqual (
        {
          "links": [ "mission" ],
          "type": "links"
        }
      )

    } )
    it ( "should handle driver.notin?", () => {
      expect ( processPathString ( clean, "driver.notin?", undefined, {}, true, undefined ) ).toEqual (
        {
          "links": [],
          "type": "links"
        }
      )
    } )

  } )
  describe ( "returning a plan", () => {
    function forPlan ( path: string ) {
      const actual = processPathString ( clean, path, undefined, {}, true, undefined )
      const data = mapErrors ( buildPlan ( clean, path.split ( '\.' ), undefined, {}, undefined ), selectData ( "all" ) )
      const expected = { type: 'selectData', data }
      return { actual, expected }
    }
    it ( "should handle driver", () => {
      const { actual, expected } = forPlan ( "driver" )
      expect ( actual ).toEqual ( expected )
    } )
    it ( "should handle driver.mission", () => {
      const { actual, expected } = forPlan ( "driver.mission" )
      expect ( actual ).toEqual ( expected )
      expect ( expected.data ).toEqual ( [
        { "alias": "T0", "columns": [ "*" ], "table": "DriverTable", "where": [] },
        { "alias": "T1", "columns": [ "*" ], "table": "mission", "where": [ "T0.driverId = T1.driverId" ] }
      ] )
    } )

  } )
  describe ( "returning a sql", () => {
    function forSql ( path: string, queryParam: NameAnd<string>, wheres?: string[] ) {
      const actual = processPathString ( clean, path, undefined, queryParam, false, wheres )
      const sql = mapErrors ( buildPlan ( clean, path.split ( '\.' ), undefined, queryParam, wheres ), plan =>
        sqlFor ( mergeSelectData ( selectData ( "all" ) ( plan ) ) ) )
      const expected = { type: 'sql', sql }
      return { actual, expected }
    }
    it ( "should handle driver", () => {
      const { actual, expected } = forSql ( "driver", {} )
      expect ( actual ).toEqual ( expected )
    } )
    it ( "should handle driver.mission", () => {
      const { actual, expected } = forSql ( "driver.mission", {} )
      expect ( actual ).toEqual ( expected )
      expect ( expected.sql ).toEqual ( [
        "select T0.*, T1.*",
        "   from DriverTable T0, mission T1 where T0.driverId = T1.driverId"
      ] )
    } )
    it ( "should handle driver.mission with a query param and where", () => {
      const { actual, expected } = forSql ( "driver.mission", {}, [ "w1" ] )
      expect ( actual ).toEqual ( expected )
      expect ( expected.sql ).toEqual ( [
        "select T0.*, T1.*",
        "   from DriverTable T0, mission T1 where w1 and T0.driverId = T1.driverId"
      ] )
    } )
    it ( "should handle driver.mission with a query param and wheres", () => {
      const { actual, expected } = forSql ( "driver.mission", {}, [ "w1", "w2" ] )
      expect ( actual ).toEqual ( expected )
      expect ( expected.sql ).toEqual ( [
        "select T0.*, T1.*",
        "   from DriverTable T0, mission T1 where w1 and w2 and T0.driverId = T1.driverId"
      ] )
    } )
    it ( "should handle driver.mission with a query param and wheres and a queryparam in driver and mission", () => {
      const { actual, expected } = forSql ( "driver.mission", { employeeNum: "123", "date": "thedate" }, [ "w1", "w2" ] )
      expect ( actual ).toEqual ( expected )
      expect ( expected.sql ).toEqual ( [
        "select T0.*, T1.*",
        "   from DriverTable T0, mission T1 where w1 and w2 and T0.employeeNum='123' and T1.date='thedate' and T0.driverId = T1.driverId"
      ] )
    } )

  } )
} )
