import { cleanEnvironment, environmentValidator } from "./environments";
import { cleanEnv, environment } from "./environment.fixture";


describe ( "environment", () => {
  it ( "should validate postgress", () => {
    expect ( environmentValidator ( "prefix" ) ( environment.dev ) ).toEqual ( [] );
    expect ( environmentValidator ( "prefix" ) ( environment.test ) ).toEqual ( [] );
    expect ( environmentValidator ( "prefix" ) ( { type: 'postgres' } as any ) ).toEqual ( [
      "prefix.schema is undefined",
      "prefix.port is undefined",
      "prefix.host is undefined",
      "prefix.database is undefined"
    ] );
    expect ( environmentValidator ( "prefix" ) ( { ...environment, "type": "theUnknownOne" } as any ) ).toEqual ( [
      "Unknown environment type theUnknownOne. Currently only postgres and oracle are supported. {\"dev\":{\"type\":\"postgres\",\"host\":\"localhost\",\"schema\":\"public\",\"port\":5432,\"database\":\"postgres\",\"username\":\"phil\",\"password\":\"phil\"},\"test\":{\"type\":\"postgres\",\"host\":\"localhost\",\"schema\":\"public\",\"port\":5432,\"database\":\"postgres\"},\"oracle\":{\"connection\":\"someConnect\",\"schema\":\"someSchema\",\"type\":\"oracle\",\"username\":\"phil\",\"password\":\"phil\"},\"type\":\"theUnknownOne\"}"
    ] );
  } )
  it ( "should validate oracle", () => {
    expect ( environmentValidator ( "prefix" ) ( environment.oracle ) ).toEqual ( [] );
    expect ( environmentValidator ( "prefix" ) ( {type: 'oracle'} as any ) ).toEqual ( [
      "prefix.schema is undefined",
      "prefix.connection is undefined"
    ]);
  } )
} )

describe ( "cleanEnv", () => {
  it ( "should clean values given", () => {
    expect ( cleanEnvironment ( { "DB_AUTO_TEST_USERNAME": "testUser", "DB_AUTO_TEST_PASSWORD": "testPass" }, environment ) ).toEqual ( {
      "dev": {
        "database": "postgres",
        "host": "localhost",
        "name": "dev",
        "password": "phil",
        "port": 5432,
        "schema": "public",
        "type": "postgres",
        "username": "phil"
      },
      "oracle": {
        "connection": "someConnect",
        "name": "oracle",
        "password": "phil",
        "schema": "someSchema",
        "type": "oracle",
        "username": "phil"
      },
      "test": {
        "database": "postgres",
        "host": "localhost",
        "name": "test",
        "password": "testPass",
        "port": 5432,
        "schema": "public",
        "type": "postgres",
        "username": "testUser"
      }
    } )
  } )
} )