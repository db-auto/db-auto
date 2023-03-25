import { makeCreateTableSqlForMock } from "./mocks";
import { clean } from "@db-auto/tables";

describe ( "createtable", () => {
  it ( "should create a table", () => {
    expect ( makeCreateTableSqlForMock ( clean.driver ) ).toEqual ( "CREATE TABLE DriverTable ( id integer,livesIn string,age integer,dateOfBirth date,personalCar string );" )
  } )
} )