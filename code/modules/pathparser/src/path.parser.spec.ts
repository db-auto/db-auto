import { fullTableName, PathValidator, PathValidatorAlwaysOK } from "@dbpath/dal";
import { driverMissionAuditPath, sampleSummary } from "@dbpath/fixtures";
import { TableInPath, TwoIds } from "@dbpath/types";
import { parseLink, parsePath, parseTable, PathParserContext } from "./path.parser";
import { ParserContext, ResultAndContext, tokenise } from "@dbpath/parser";

export function errorData<C extends ParserContext, R> ( pr: ResultAndContext<C, R>, s: string ) {
  let token = pr.context.tokens[ pr.context.pos ];
  let pos = token ? token.pos : s.length;
  return { error: pr.error, token, pos, s };
}

const name2Pk = {
  driver: [ 'driverId' ],
  drivertable: [ 'driverId' ],
  mission: [ 'id' ],
  driver_aud: [ 'id' ],
}
const validator =
        { ...PathValidatorAlwaysOK, actualTableName: t => fullTableName ( sampleSummary, t ), pkFor: tableName => name2Pk[ tableName ] };
function makeContext ( s: string ): PathParserContext {
  return {
    tokens: tokenise ( "junk." + s ),
    pos: 2,
    validator: validator
  }
}
function pt ( s: string, consume: number ) {
  let initialContext = makeContext ( s )
  let { context, result, error } = parseTable ( initialContext );
  if ( error ) throw error
  expect ( context.pos - initialContext.pos ).toEqual ( consume );
  return result
}
function pl ( s: string, consume: number, pt?: TableInPath ) {
  let initialContext = makeContext ( s )
  let { context, result, error } = parseLink ( pt ) ( initialContext );
  if ( error ) throw error
  expect ( context.pos - initialContext.pos ).toEqual ( consume );
  return result
}
describe ( "parseTable", () => {


  function ptError ( s: string, errorPos: number ) {
    let initialContext = makeContext ( s )
    let cr = parseTable ( initialContext );
    const { context, result, error } = cr
    expect ( result ).toBeUndefined ()
    const { pos } = errorData ( cr, 'junk.' + s )
    expect ( pos - 'junk.'.length ).toEqual ( errorPos )
    return error
  }
  it ( "should parse drive", () => {
    expect ( pt ( "driver", 1 ) ).toEqual ( { table: "drivertable", fields: [], "pk": [ "driverId" ], } )
    expect ( pt ( "driver.", 1 ) ).toEqual ( { table: "drivertable", fields: [], "pk": [ "driverId" ], } )
  } )
  it ( "should parse mission", () => {
    expect ( pt ( "mission", 1 ) ).toEqual ( { table: "mission", fields: [], "pk": [ "id" ] } )
    expect ( pt ( "mission.", 1 ) ).toEqual ( { table: "mission", fields: [], "pk": [ "id" ] } )
  } )
  it ( "should parse driver[field1,field2]", () => {
    expect ( pt ( "driver[field1]", 4 ) ).toEqual ( { table: "drivertable", fields: [ "field1" ], "pk": [ "driverId" ] } )
    expect ( pt ( "driver[field1,field2]", 6 ) ).toEqual ( { table: "drivertable", fields: [ "field1", "field2" ], "pk": [ "driverId" ] } )
  } )
  it ( "should report nice error messages", () => {
    expect ( ptError ( "driver[", 7 ) ).toEqual ( [ "Expected a field but got to end" ] );
    expect ( ptError ( "driver[{]", 7 ) ).toEqual ( [ "Expected a field unexpected character {" ] );
  } )
} )

describe ( "parseLink", () => {
  it ( "should parse .table}", () => {
    expect ( pl ( ".driver", 2 ) ).toEqual ( { table: "drivertable", fields: [], "idEquals": [], "pk": [ "driverId" ] } )
    expect ( pl ( ".mission,", 2 ) ).toEqual ( { table: "mission", fields: [], "idEquals": [], "pk": [ "id" ] } )
  } )
  it ( "should parse .driver[f1,f2]", () => {
    const previousLink = pt ( "someTable", 1 )
    expect ( pl ( ".driver[f1,f2]", 7, previousLink ) ).toEqual ( {
      "table": "drivertable",
      "pk": [ "driverId" ],
      "fields": [ "f1", "f2" ],
      previousLink,
      "idEquals": [],
    } )
  } )

  it ( "should parse .drive.mission.audit", () => {
    expect ( pl ( ".driver.mission.audit", 6 ) ).toEqual ( driverMissionAuditPath )
  } )
  it ( "should handle just an id in the id=id part", () => {
    expect ( pl ( ".driver.{driver}mission", 7 ) ).toEqual ( {
      "previousLink": {
        "fields": [],
        "idEquals": [],
        pk: [ "driverId" ],
        "table": "drivertable"
      },
      "table": "mission",
      "fields": [],
      pk: [ "id" ],
      "idEquals": [ { "fromId": "driver", "toId": "driver" } ],
    } )
  } )
  it ( "should parse .{id1=id2}drive", () => {
    expect ( pl ( ".{id1=id2}driver", 7 ) ).toEqual ( {
      "fields": [],
      "idEquals": [ { "fromId": "id1", "toId": "id2" } ],
      pk: [ "driverId" ],
      "table": "drivertable"
    } )
  } )

  it ( "should parse .driver.mission.audit", () => {
    expect ( pl ( ".driver.mission.audit", 6 ) ).toEqual ( {
      "previousLink": {
        "previousLink": {
          "fields": [],
          "idEquals": [],
          pk: [ "driverId" ],
          "table": "drivertable"
        },
        "table": "mission",
        pk: [ "id" ],
        "fields": [],
        "idEquals": [],
      },
      "table": "driver_aud",
      pk: [ "id" ],
      "fields": [],
      "idEquals": [],
    } )

  } )
  it ( "should parse .drive[f1,f2].{id1=id2}mission[f3].audit", () => {
    expect ( pl ( ".driver[f1,f2].mission.audit", 11 ) ).toEqual ( {
      "previousLink": {
        "previousLink": {
          "fields": [ "f1", "f2" ],
          "table": "drivertable",
          pk: [ "driverId" ],
          "idEquals": [],
        },
        "table": "mission",
        pk: [ "id" ],
        "idEquals": [],
        "fields": [],
      },
      "table": "driver_aud",
      pk: [ "id" ],
      "idEquals": [],
      "fields": [],
    } )
  } )
} )

describe ( "parsePath", () => {
  it ( "should parse a simple path", () => {
    expect ( parsePath ( PathValidatorAlwaysOK ) ( "driver" ) ).toEqual ( {
      "fields": [],
      "table": "driver",
      pk: [ "id" ],
    } )
  } )
  it ( "should parse a complex path", () => {

    expect ( parsePath ( validator ) ( "driver.{id1=id2}mission.audit[f3,f4]" ) ).toEqual ( {
      "previousLink": {
        "previousLink": {
          "fields": [],
          "table": "drivertable",
          pk: [ "driverId" ],
        },
        "table": "mission",
        "fields": [],
        pk: [ "id" ],
        "idEquals": [ { "fromId": "id1", "toId": "id2" } ],
      },
      "table": "driver_aud",
      pk: [ "id" ],
      "fields": [ "f3", "f4" ], "idEquals": [],
    } )
  } )
  describe ( "error message", () => {
    it ( "should process a{}", () => {
      expect ( parsePath ( validator ) ( "a{}" ) ).toEqual ( [
        "a{}",
        " ^",
        "Expected '.'"
      ] )
    } )
    it ( "should process a.{}", () => {
      expect ( parsePath ( validator ) ( "a.{}" ) ).toEqual ( [
        "a.{}",
        "   ^",
        "Expected a 'from id'='to id' unexpected character }"
      ] )
    } )
    it ( "should process a.[]", () => {
      expect ( parsePath ( validator ) ( "a.[]" ) ).toEqual ( [
        "a.[]",
        "  ^",
        "Expected a schema or table unexpected character ["
      ] )
    } )
    it ( "should process a.(noequals)b", () => {
      expect ( parsePath ( validator ) ( "a.{noequals}b" ) ).toEqual ( {
        "fields": [],
        "idEquals": [ { "fromId": "noequals", "toId": "noequals" } ],
        "previousLink": { "fields": [], "table": "a" },
        "table": "b"
      } )
    } )
  } )
} )


describe ( "schemas", () => {
  it ( "should process s0:driver.{driverId=id}s1:mission.s2:audit", () => {
    expect ( parsePath ( validator ) ( " s0:driver.{driverId=id}s1:mission.s2:audit" ) ).toEqual ( {
      "fields": [],
      "idEquals": [],
      "pk": [
        "id"
      ],
      "previousLink": {
        "fields": [],
        "idEquals": [
          {
            "fromId": "driverId",
            "toId": "id"
          }
        ],
        "pk": [
          "id"
        ],
        "previousLink": {
          "fields": [],
          "pk": [
            "driverId"
          ],
          "schema": " s0",
          "table": "drivertable"
        },
        "schema": "s1",
        "table": "mission"
      },
      "schema": "s2",
      "table": "driver_aud"
    } )
  } )

} )
describe ( "PathValidator in parsePath", () => {
  it ( "should be called", () => {
    var remembered: string[] = []
    const rem: PathValidator = {
      validateFields ( tableName: string, fields: string[] ): string[] {
        remembered.push ( `vFields(${tableName})[${fields}]` )
        return [];
      },
      validateLink ( fromTableName: string, toTableName: string, idEquals: TwoIds[] ): string[] {
        remembered.push ( `vLink(${fromTableName},${toTableName})[${idEquals.map ( i => `${i.fromId}=${i.toId}` )}]` )
        return [];
      },
      validateTableName ( tableName: string ): string[] {
        remembered.push ( `vTable(${tableName})` )
        return [];
      },
      useIdsOrSingleFkLinkOrError: ( fromTableName, toTableName, idEquals ) => {
        remembered.push ( `useIdsOrSingleFkLinkOrError(${fromTableName},${toTableName}) ${JSON.stringify ( idEquals )}` )
        return { twoIds: idEquals }
      },
      actualTableName ( tableName: string ): string {
        remembered.push ( `actualTableName(${tableName})` )
        return tableName
      },
      pkFor ( tableName: string ): string[] {
        remembered.push ( `pkFor(${tableName})` )
        return [ 'id' ]
      }
    }
    parsePath ( rem ) ( "driver.{id1=id2}mission.audit[f3,f4]" )
    expect ( remembered.sort () ).toEqual ( [
      "actualTableName(audit)",
      "actualTableName(driver)",
      "actualTableName(mission)",
      "pkFor(audit)",
      "pkFor(driver)",
      "pkFor(mission)",
      "useIdsOrSingleFkLinkOrError(driver,mission) [{\"fromId\":\"id1\",\"toId\":\"id2\"}]",
      "useIdsOrSingleFkLinkOrError(mission,audit) []",
      "vFields(audit)[f3,f4]",
      "vFields(driver)[]",
      "vFields(mission)[]",
      "vLink(driver,mission)[id1=id2]",
      "vLink(mission,audit)[]",
      "vTable(audit)",
      "vTable(driver)",
      "vTable(mission)"
    ] )
  } )
  it ( "should error if table name validator fails", () => {
    const pv = {
      ...PathValidatorAlwaysOK,
      validateTableName: ( table ) => [ `table ${table} error` ]
    }
    expect ( parsePath ( pv ) ( "driver" ) ).toEqual ( [
      "driver",
      "      ^",
      "table driver error"
    ] )
  } )
  it ( "should error if table name field fails", () => {
    const pv = {
      ...PathValidatorAlwaysOK,
      validateFields: ( table ) => [ `fields ${table} error` ]
    }
    expect ( parsePath ( pv ) ( "driver" ) ).toEqual ( [
      "driver",
      "      ^",
      "fields driver error"
    ] )
  } )
  it ( "should error if table links validator fails with driver.mission", () => {
    const pv = {
      ...PathValidatorAlwaysOK,
      validateLink: ( table1, table2, ids ) => [ `link ${table1}.${table2} error ${JSON.stringify ( ids )}` ]
    }
    expect ( parsePath ( pv ) ( "driver.mission" ) ).toEqual ( [
      "driver.mission",
      "       ^",
      "link driver.mission error []"
    ] )
  } )
  it ( "should error if table links validator fails with driver.(id1=id2)mission.audit", () => {
    const pv = {
      ...PathValidatorAlwaysOK,
      validateLink: ( table1, table2, ids ) => [ `link ${table1}.${table2} error ${JSON.stringify ( ids )}` ]
    }
    expect ( parsePath ( pv ) ( "driver.{id1=id2}mission.audit" ) ).toEqual ( [
      "driver.{id1=id2}mission.audit",
      "                ^",
      "link driver.mission error [{\"fromId\":\"id1\",\"toId\":\"id2\"}]"
    ] )
  } )

} )