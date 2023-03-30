import { mapToNameAndColumnData } from "./clean";
import { tables } from "./query.fixture";
import { cleanTable } from "./tables";

describe ( 'columnDataForNameAnd', () => {
  it ( "should return a clean column data object", () => {
    expect ( mapToNameAndColumnData ( tables.driver.dataColumns ) ).toEqual ( {
      "age": {
        "description": "",
        "name": "age",
        "type": "integer"
      },
      "dateOfBirth": {
        "description": "",
        "name": "dateOfBirth",
        "type": "date"
      },
      "livesIn": {
        "description": "",
        "name": "livesIn",
        "type": "string"//added
      },
      "personalCar": {
        "description": "",
        "name": "personalCar",
        "type": "string"
      }
    } )
  } )
} )

describe ( "cleanTable", () => {
  it ( "should return a clean table object, opt params given", () => {
    expect ( cleanTable ( tables.driver, "driver" ) ).toEqual ( {
      "dataColumns": {
        "age": { "type": "integer" },
        "dateOfBirth": { "type": "date" },
        "livesIn": { "type": "string" },
        "personalCar": {}
      },
      "links": {
        "audit": { "idHereAndThere": "driverId", "type": "one-to-many", "table": "driver_aud", },
        "mission": { "idHereAndThere": "driverId", "type": "one-to-many" }
      },
      "primary": { "name": "id", "type": "integer" },
      "queries": {
        "employeeNum": { "type": "string" },
        "name": { "description": "driver name ", "type": "string" }
      },
      "table": "drivertable",
      "views": { "all": "*", "short": [ "id", "name" ] }
    } )
  } )
  it ( "should return a clean table object", () => {
    expect ( cleanTable ( tables.mission, "mission" ) ).toEqual ( {
      "links": {
        "driver": { "idHereAndThere": "driverId", "type": "many-to-one" },
        "mission_aud": { "idHereAndThere": "missionId", "type": "one-to-many" }
      },
      "primary": "id",
      "queries": {
        "date": { "type": "date" }
      },
      "table": "mission",
      "views": { "all": "*", "short": [ "id", "driverId" ] }
    } )
  } )
} )