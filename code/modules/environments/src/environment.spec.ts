import { cleanEnvironment, environmentValidator } from "./environments";
import { cleanEnv, environment } from "./environment.fixture";


describe ( "environment", () => {
  it ( "should validate", () => {
    expect ( environmentValidator ( "prefix" ) ( environment.dev ) ).toEqual ( [] );
    expect ( environmentValidator ( "prefix" ) ( environment.test ) ).toEqual ( [] );
    expect ( environmentValidator ( "prefix" ) ( { type: 'postgres' } as any ) ).toEqual ( [
      "prefix.port is undefined",
      "prefix.host is undefined",
      "prefix.database is undefined"
    ]);
    expect ( environmentValidator ( "prefix" ) ( { ...environment, "type": "theUnknownOne" } as any ) ).toEqual ( [
      "Unknown environment type theUnknownOne. Currently on postgres is supported. {\"dev\":{\"type\":\"postgres\",\"host\":\"localhost\",\"port\":5432,\"database\":\"postgres\",\"username\":\"phil\",\"password\":\"phil\"},\"test\":{\"type\":\"postgres\",\"host\":\"localhost\",\"port\":5432,\"database\":\"postgres\"},\"type\":\"theUnknownOne\"}"
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
        "type": "postgres",
        "username": "phil"
      },
      "test": {
        "database": "postgres",
        "host": "localhost",
        "name": "test",
        "password": "testPass",
        "port": 5432,
        "type": "postgres",
        "username": "testUser"
      }
    } )
  } )
} )