import { errors, ErrorsAnd, hasErrors, NameAnd } from "@db-auto/utils";
import { cleanTables, Table } from "./tables";
import { buildPlan, Plan, PlanLink } from "./query";

const tables: NameAnd<Table> = {
  "driver": {
    "table": "DriverTable",
    "primary": { "name": "id", "type": "integer" },
    "queries": {
      "name": { "type": "string", "description": "driver name " },
      "employeeNum": { "type": "string" }
    },
    "links": {
      "mission": { "type": "one-to-many", "idHereAndThere": "driverId" },
      "audit": { "type": "one-to-many", "idHereAndThere": "driverId" }
    },
    "views": {
      "all": "*",
      "short": [ "id", "name" ]
    }
  },
  "driver_aud": {
    "primary": { "name": "driverId", "type": "integer" },
    "views": {
      "all": "*",
      "short": [ "driverId", "action", "date" ]
    }
  },
  "mission": {
    "primary": { "name": "id", "type": "integer" },
    "queries": { "date": { "type": "date" } },
    "links": {
      "driver":
        { "type": "many-to-one", "idHereAndThere": "driverId" },
      "mission_aud": { "type": "one-to-many", "idHereAndThere": "missionId" }
    },
    "views": {
      "all": "*",
      "short": [ "id", "driverId" ]
    }
  },
  "mission_aud": {
    "primary": { "name": "missionId", "type": "integer" },
    "views": {
      "all": "*",
      "short": [ "missionId", "action", "date" ]
    }
  }
}

const clean = cleanTables ( tables )
function planLinkToString ( p: PlanLink ) {
  return `${p.link.type} ${planToString ( p.linkTo )}`
}
function planToString ( p: ErrorsAnd<Plan> ): string {
  if ( hasErrors ( p ) ) return JSON.stringify ( p )
  const planLinkString = p.planLink ? ` ${planLinkToString ( p.planLink )}` : ''
  return `${p.table.table}${planLinkString}`
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
