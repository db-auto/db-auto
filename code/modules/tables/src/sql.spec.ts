import { driverMissionAuditWithFieldsAndLinksPath, driverPath, sampleMeta } from "@dbpath/fixtures";
import { mapOverPath, pathToSelectData, pathToSql } from "./sql";


describe ( "mapOverPath", () => {
  it ( "should walk over the path and return values", () => {
    expect ( mapOverPath ( driverPath, p => p.table ) ).toEqual ( [ "drivertable" ] )
    expect ( mapOverPath ( driverMissionAuditWithFieldsAndLinksPath, p => p.table ) ).toEqual ( [ "drivertable", "mission", "audit" ] )
  } )

} )

const table2Pk = sampleMeta.tables

const schema= 'someSchema'
describe ( "pathToSelectData", () => {
  it ( "should make an array of select data", () => {
    expect ( pathToSelectData ( driverPath, { schema,table2Pk } ) ).toEqual ( [ { "alias": "T0", "columns": [ '*' ], "table": "someSchema.drivertable", "where": [] } ] )
  } )
  it ( "should make an array of select data with id", () => {
    expect ( pathToSelectData ( driverPath, {schema, id: '1', table2Pk } ) ).toEqual ( [
      {
        "alias": "T0",
        "columns": [ "*" ],
        "table": "someSchema.drivertable",
        "where": [ "T0.driverid=1" ]
      }
    ] )
  } )

  it ( "should make an array of select data for driver.mission.audit", () => {
    expect ( pathToSelectData ( driverMissionAuditWithFieldsAndLinksPath, { schema,table2Pk } ) ).toEqual ( [
      { "alias": "T0", "columns": [ '*' ], "table": "someSchema.drivertable", "where": [] },
      { "alias": "T1", "columns": [ '*' ], "table": "someSchema.mission", "where": [ "T0.id1 = T1.id2" ] },
      { "alias": "T2", "columns": [ "f3", "f4" ], "table": "someSchema.audit", "where": [ "T1.id2 = T2.id3" ] }
    ] )
  } )

  it ( "should make an array of select data for driver.mission.audit 123", () => {
    expect ( pathToSelectData ( driverMissionAuditWithFieldsAndLinksPath, { schema, id: '1', table2Pk } ) ).toEqual ( [
      { "alias": "T0", "columns": [ '*' ], "table": "someSchema.drivertable", "where": [ "T0.driverid=1" ] },
      { "alias": "T1", "columns": [ '*' ], "table": "someSchema.mission", "where": [ "T0.id1 = T1.id2" ] },
      { "alias": "T2", "columns": [ "f3", "f4" ], "table": "someSchema.audit", "where": [ "T1.id2 = T2.id3" ] }
    ] )
  } )

} )

describe ( "pathToSql", () => {
  it ( "should make sql without ids", () => {
    expect ( pathToSql ( {}, driverMissionAuditWithFieldsAndLinksPath, { schema, table2Pk } ) ).toEqual ( [
      "select T0.*, T1.*, T2.f3, T2.f4",
      "   from someSchema.drivertable T0, someSchema.mission T1, someSchema.audit T2 where T0.id1 = T1.id2 and T1.id2 = T2.id3"
    ] )
  } )

  it ( "should make sql with integerids", () => {
    expect ( pathToSql ( {}, driverMissionAuditWithFieldsAndLinksPath, {  schema,id: '123', table2Pk } ) ).toEqual ( [
      "select T0.*, T1.*, T2.f3, T2.f4",
      "   from someSchema.drivertable T0, someSchema.mission T1, someSchema.audit T2 where T0.driverid=123 and T0.id1 = T1.id2 and T1.id2 = T2.id3"
    ] )
  } )
} )