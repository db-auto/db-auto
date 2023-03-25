import { ErrorsAnd, hasErrors, mapErrors } from "@db-auto/utils";
import { buildPlan, Plan, PlanLink } from "./query";
import { mergeSelectData, selectData, sqlFor } from "./sql";
import { clean } from "./query.fixture";

function planLinkToString ( p: PlanLink ) {
  return `${p.link.type} ${planToString ( p.linkTo )}`
}
function planToString ( p: ErrorsAnd<Plan> ): string {
  if ( hasErrors ( p ) ) return JSON.stringify ( p )
  const planLinkString = p.planLink ? ` ${planLinkToString ( p.planLink )}` : ''
  return `${p.table.tableName}${planLinkString}`
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
      [ { "columns": [ "*" ], "table": "DriverTable", alias: "T0" } ] )
  } )
  it ( "should build selectData with two steps", () => {
    expect ( mapErrors ( buildPlan ( clean, [ "driver", "mission" ] ), selectData ( "all" ) ) ).toEqual (
      [
        { "columns": [ "*" ], "table": "DriverTable", alias: "T0", "where": "T0.driverId = T1.driverId" },
        { "columns": [ "*" ], "table": "mission", alias: "T1" } ] )
  } )
  it ( "should build selectData with three steps", () => {
    expect ( mapErrors ( buildPlan ( clean, [ "driver", "mission", "mission_aud" ] ), selectData ( "all" ) ) ).toEqual ( [
      { "columns": [ "*" ], "table": "DriverTable", alias: "T0", "where": "T0.driverId = T1.driverId" },
      { "columns": [ "*" ], "table": "mission", alias: "T1", "where": "T1.missionId = T2.missionId" },
      { "columns": [ "*" ], "table": "mission_aud", alias: "T2" } ] )
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
      "columns": [ { "alias": "T0", "column": "*" }, { "alias": "T1", "column": "*" }, { "alias": "T2", "column": "*" } ],
      "tables": [ { "alias": "T0", "table": "DriverTable" }, { "alias": "T1", "table": "mission" }, { "alias": "T2", "table": "mission_aud" } ],
      "where": [ "T0.driverId = T1.driverId", "T1.missionId = T2.missionId" ]
    } )
  } )

} )

describe ( "sqlFor", () => {
  it ( "should make sql for a single step", () => {
    expect ( mapErrors ( buildPlan ( clean, [ "driver" ] ), plan => sqlFor ( mergeSelectData ( selectData ( "all" ) ( plan ) ) ) ) ).toEqual (
      "select T0.* from DriverTable T0 "
    )
  } )
  it ( "should make sql for two steps", () => {
    expect ( mapErrors ( buildPlan ( clean, [ "driver", "mission" ] ), plan => sqlFor ( mergeSelectData ( selectData ( "all" ) ( plan ) ) ) ) ).toEqual (
      "select T0.*, T1.* from DriverTable T0, mission T1 where T0.driverId = T1.driverId"
    )
  } )
  it ( "should make sql for three steps", () => {
    expect ( mapErrors ( buildPlan ( clean, [ "driver", "mission", "mission_aud" ] ), plan => sqlFor ( mergeSelectData ( selectData ( "all" ) ( plan ) ) ) ) ).toEqual (
      "select T0.*, T1.*, T2.* from DriverTable T0, mission T1, mission_aud T2 where T0.driverId = T1.driverId and T1.missionId = T2.missionId"
    )
  } )

} )