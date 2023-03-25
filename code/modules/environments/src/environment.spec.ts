import { cleanEnvironment, environmentValidator } from "./environments";
import { cleanEnv, environment } from "./environment.fixture";


describe ( "environment", () => {
  it ( "should validate", () => {
    expect ( environmentValidator ( "prefix" ) ( environment.dev ) ).toEqual ( [] );
    expect ( environmentValidator ( "prefix" ) ( environment.test ) ).toEqual ( [] );
    expect ( environmentValidator ( "prefix" ) ( {} as any ) ).toEqual ( [
      "prefix.type is undefined",
      "prefix.url is undefined"
    ] );
    expect ( environmentValidator ( "prefix" ) ( { "type": "theUnknownOne" } as any ) ).toEqual ( [
      "prefix.type is [\"theUnknownOne\"] not one of [\"oracle\",\"mysql\",\"postgres\"]",
      "prefix.url is undefined"
    ] );

    expect ( environmentValidator ( "prefix" ) ( { "type": "mysql", url: "some", "username": 123 } as any ) ).toEqual ( [ "prefix.username is [123] which is a number and not a string" ] );
    expect ( environmentValidator ( "prefix" ) ( { "type": "mysql", url: "some", "password": 123 } as any ) ).toEqual ( [ "prefix.password is [123] which is a number and not a string" ] );
  } )
} )

describe ( "cleanEnv", () => {
  it ( "should clean values given", () => {
    expect ( cleanEnvironment ( { "DB_AUTO_TEST_USERNAME": "testUser", "DB_AUTO_TEST_PASSWORD": "testPass" }, environment ) ).toEqual ( {
      "dev": {
        "name": "dev",
        "password": "",
        "type": "postgres",
        "url": "postgres://localhost:5432/dev",
        "username": "sa"
      },
      "test": {
        "name": "test",
        "password": "testPass",
        "type": "postgres",
        "url": "postgres://localhost:5432/test",
        "username": "testUser"
      }
    } )
  } )
} )