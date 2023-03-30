import { makeCreateTableSqlForMock } from "./mocks";
import { clean } from "@dbpath/tables";

describe ( "createtable", () => {
  it ( "should create a table", () => {
    expect ( makeCreateTableSqlForMock ( clean.driver ) ).toEqual ( "CREATE TABLE drivertable ( id integer,livesIn string,age integer,dateOfBirth date,personalCar string );" )
  } )
} )