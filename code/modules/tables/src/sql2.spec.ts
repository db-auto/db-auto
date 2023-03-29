import { isLinkInPath, PathItem } from "@dbpath/types";
import { MergedSelectData } from "./sql";
import { driverMissionAuditWithFieldsAndLinksPath, driverPath } from "@dbpath/fixtures";
import { mapOverPath, pathToSelectData, pathToSql } from "./sql2";


describe ( "mapOverPath", () => {
  it ( "should walk over the path and return values", () => {
    expect ( mapOverPath ( driverPath, p => p.table ) ).toEqual ( [ "driver" ] )
    expect ( mapOverPath ( driverMissionAuditWithFieldsAndLinksPath, p => p.table ) ).toEqual ( [ "driver", "mission", "audit" ] )
  } )

} )

describe ( "pathToSelectData", () => {
  it ( "should make an array of select data", () => {
    expect ( pathToSelectData ( driverPath ) ).toEqual ( [ { "alias": "T0", "columns": ['*'], "table": "driver", "where": [] } ] )
  } )

  it ( "should make an array of select data for driver.mission.audit", () => {
    expect ( pathToSelectData ( driverMissionAuditWithFieldsAndLinksPath ) ).toEqual ( [
      { "alias": "T0", "columns": ['*'], "table": "driver", "where": [] },
      { "alias": "T1", "columns": ['*'], "table": "mission", "where": [ "T0.id1=T1.id2" ] },
      { "alias": "T2", "columns": [ "f3", "f4" ], "table": "audit", "where": [ "T1.id2=T2.id3" ] }
    ] )
  } )

} )

describe ( "pathToSql", () => {
  it ( "should make sql", () => {
    expect ( pathToSql ( {}, driverMissionAuditWithFieldsAndLinksPath ) ).toEqual ( [
      "select T0.*, T1.*, T2.f3, T2.f4",
      "   from driver T0, mission T1, audit T2 where T0.id1=T1.id2 and T1.id2=T2.id3"
    ])
  } )
} )