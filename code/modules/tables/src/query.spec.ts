import { ErrorsAnd, hasErrors, mapErrors } from "@db-auto/utils";
import { buildPlan, Plan, PlanLink } from "./query";
import { mergeSelectData, selectData, sqlFor } from "./sql";
import { clean } from "./query.fixture";

function previousToString ( p: PlanLink ): string {
  return p.link.type ? p.link.type : '';
}
function planToString ( p: ErrorsAnd<Plan> ): string {
  if ( hasErrors ( p ) ) return JSON.stringify ( p )
  const thisString = p.table.table
  const previousString = p.linkToPrevious ? planToString ( p.linkToPrevious.linkTo ) + ' ' + previousToString ( p.linkToPrevious ) + ' ' : ''
  return `${previousString}${thisString}`
}
describe ( "buildPlan", () => {
  it ( "should build a plan with just one step", () => {
    expect ( planToString ( buildPlan ( clean, [ "driver" ] ) ) ).toEqual ( 'DriverTable' )
  } )
  it ( "should build a plan with two steps", () => {
    expect ( planToString ( buildPlan ( clean, [ "driver", "mission" ] ) ) ).toEqual ( 'DriverTable one-to-many mission' )
  } )
  it ( "should build a plan with three steps", () => {
    expect ( planToString ( buildPlan ( clean, [ "driver", "mission", "mission_aud" ] ) ) ).toEqual ( 'DriverTable one-to-many mission one-to-many mission_aud' )
  } )

} )

describe ( "selectData", () => {
  it ( "should build selectData with just one step", () => {
    expect ( mapErrors ( buildPlan ( clean, [ "driver" ] ), selectData ( "all" ) ) ).toEqual (
      [ { "columns": [ "*" ], "table": "DriverTable", alias: "T0", where: [] } ] )
  } )
  it ( "should build selectData with two steps", () => {
    expect ( mapErrors ( buildPlan ( clean, [ "driver", "mission" ] ), selectData ( "all" ) ) ).toEqual ( [
      { "alias": "T0", "columns": [ "*" ], "table": "DriverTable", where: [] },
      { "alias": "T1", "columns": [ "*" ], "table": "mission", "where": [ "T0.driverId = T1.driverId" ] }
    ] )
  } )
  it ( "should build selectData when the link isn't the table name", () => {
    expect ( mapErrors ( buildPlan ( clean, [ "driver", "audit" ] ), selectData ( "all" ) ) ).toEqual ( [
      { "alias": "T0", "columns": [ "*" ], "table": "DriverTable", where: [] },
      { "alias": "T1", "columns": [ "*" ], "table": "driver_aud", "where": [ "T0.driverId = T1.driverId" ] } ] )
  } )
  it ( "should build selectData with three steps and an id", () => {
    expect ( mapErrors ( buildPlan ( clean, [ "driver", "mission", "mission_aud" ], "123" ), selectData ( "all" ) ) ).toEqual ( [
      { "alias": "T0", "columns": [ "*" ], "table": "DriverTable", "where": [ "T0.id=123" ] },
      { "alias": "T1", "columns": [ "*" ], "table": "mission", "where": [ "T0.driverId = T1.driverId" ] },
      { "alias": "T2", "columns": [ "*" ], "table": "mission_aud", "where": [ "T1.missionId = T2.missionId" ] }
    ] )
  } )
} )

describe ( "merge", () => {
  it ( "should mergeSelectData just one step", () => {
    expect ( mapErrors ( buildPlan ( clean, [ "driver" ] ), plan => mergeSelectData ( selectData ( "all" ) ( plan ) ) ) ).toEqual ( {
      "columns": [ { "alias": "T0", "column": "*" } ],
      "tables": [ { "alias": "T0", "table": "DriverTable" } ],
      "where": []
    } )
  } )
  it ( "should mergeSelectData with two steps", () => {
    expect ( mapErrors ( buildPlan ( clean, [ "driver", "mission" ] ), plan => mergeSelectData ( selectData ( "all" ) ( plan ) ) ) ).toEqual ( {
      "columns": [ { "alias": "T0", "column": "*" }, { "alias": "T1", "column": "*" } ],
      "tables": [ { "alias": "T0", "table": "DriverTable" }, { "alias": "T1", "table": "mission" } ],
      "where": [ "T0.driverId = T1.driverId" ]
    } )
  } )
  it ( "should mergeSelectData with three steps", () => {
    expect ( mapErrors ( buildPlan ( clean, [ "driver", "mission", "mission_aud" ] ), plan => mergeSelectData ( selectData ( "all" ) ( plan ) ) ) ).toEqual ( {
      "columns": [
        { "alias": "T0", "column": "*" },
        { "alias": "T1", "column": "*" },
        { "alias": "T2", "column": "*" }
      ],
      "tables": [
        { "alias": "T0", "table": "DriverTable" },
        { "alias": "T1", "table": "mission" },
        { "alias": "T2", "table": "mission_aud" }
      ],
      "where": [ "T0.driverId = T1.driverId", "T1.missionId = T2.missionId" ]
    } )
  } )

} )

describe ( "sqlFor", () => {
  it ( "should make sql for a single step", () => {
    expect ( mapErrors ( buildPlan ( clean, [ "driver" ] ), plan => sqlFor ( mergeSelectData ( selectData ( "all" ) ( plan ) ) ) ) ).toEqual ( [
      "select T0.*",
      "   from DriverTable T0"
    ] )
  } )
  it ( "should make sql for two steps", () => {
    expect ( mapErrors ( buildPlan ( clean, [ "driver", "mission" ] ), plan => sqlFor ( mergeSelectData ( selectData ( "all" ) ( plan ) ) ) ) ).toEqual ( [
      "select T0.*, T1.*",
      "   from DriverTable T0, mission T1 where T0.driverId = T1.driverId"
    ] )
  } )
  it ( "should make sql for three steps", () => {
    expect ( mapErrors ( buildPlan ( clean, [ "driver", "mission", "mission_aud" ] ), plan => sqlFor ( mergeSelectData ( selectData ( "all" ) ( plan ) ) ) ) ).toEqual ( [
      "select T0.*, T1.*, T2.*",
      "   from DriverTable T0, mission T1, mission_aud T2 where T0.driverId = T1.driverId and T1.missionId = T2.missionId"
    ] )
  } )
  it ( "should make sql when link name isn't table name", () => {
    expect ( mapErrors ( buildPlan ( clean, [ "driver", "audit" ] ), plan => sqlFor ( mergeSelectData ( selectData ( "all" ) ( plan ) ) ) ) ).toEqual ( [
      "select T0.*, T1.*",
      "   from DriverTable T0, driver_aud T1 where T0.driverId = T1.driverId"
    ] )
  } )
  it ( "should make sql when link name isn't table name and there is an id", () => {
    expect ( mapErrors ( buildPlan ( clean, [ "driver", "audit" ], "123" ), plan => sqlFor ( mergeSelectData ( selectData ( "all" ) ( plan ) ) ) ) ).toEqual ( [
      "select T0.*, T1.*",
      "   from DriverTable T0, driver_aud T1 where T0.id=123 and T0.driverId = T1.driverId"
    ] )
  } )

} )