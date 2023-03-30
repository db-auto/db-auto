import { errorData, parseLink, parsePath, ParserContext, parseTable } from "./parser";
import { tokenise } from "./tokeniser";
import { fullTableName, PathValidator, PathValidatorAlwaysOK } from "@dbpath/dal";

import { driverMissionAuditPath, sampleSummary } from "@dbpath/fixtures";
import { TableInPath, TwoIds } from "@dbpath/types";


const validator = { ...PathValidatorAlwaysOK, actualTableName: t => fullTableName ( sampleSummary, t ) };
function makeContext ( s: string ): ParserContext {
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
    expect ( pt ( "driver", 1 ) ).toEqual ( { table: "drivertable", fields: [] } )
    expect ( pt ( "driver.", 1 ) ).toEqual ( { table: "drivertable", fields: [] } )
  } )
  it ( "should parse mission", () => {
    expect ( pt ( "mission", 1 ) ).toEqual ( { table: "mission", fields: [] } )
    expect ( pt ( "mission.", 1 ) ).toEqual ( { table: "mission", fields: [] } )
  } )
  it ( "should parse driver[field1,field2]", () => {
    expect ( pt ( "driver[field1]", 4 ) ).toEqual ( { table: "drivertable", fields: [ "field1" ] } )
    expect ( pt ( "driver[field1,field2]", 6 ) ).toEqual ( { table: "drivertable", fields: [ "field1", "field2" ] } )
  } )
  it ( "should report nice error messages", () => {
    expect ( ptError ( "driver[", 7 ) ).toEqual ( [ "Expected a field but got to end" ] );
    expect ( ptError ( "driver[(]", 7 ) ).toEqual ( [ "Expected a field unexpected character (" ] );
  } )
} )

describe ( "parseLink", () => {
  it ( "should parse .{table}}", () => {
    expect ( pl ( ".driver", 2 ) ).toEqual ( { table: "drivertable", fields: [], "idEquals": [], } )
    expect ( pl ( ".mission,", 2 ) ).toEqual ( { table: "mission", fields: [], "idEquals": [], } )
  } )
  it ( "should parse .driver[f1,f2]", () => {
    const previousLink = pt ( "someTable", 1 )
    expect ( pl ( ".driver[f1,f2]", 7, previousLink ) ).toEqual ( {
      "table": "drivertable",
      "fields": [ "f1", "f2" ],
      previousLink,
      "idEquals": [],
    } )
  } )

  it ( "should parse .drive.mission.audit", () => {
    expect ( pl ( ".driver.mission.audit", 6 ) ).toEqual ( driverMissionAuditPath )
  } )
  it ( "should parse .(id1=id2)drive", () => {
    expect ( pl ( ".(id1=id2)driver", 7 ) ).toEqual ( {
      "fields": [],
      "idEquals": [
        {
          "fromId": "id1",
          "toId": "id2"
        }
      ],
      "table": "drivertable"
    } )
  } )

  it ( "should parse .driver.mission.audit", () => {
    expect ( pl ( ".driver.mission.audit", 6 ) ).toEqual ( {
      "fields": [],
      "idEquals": [],
      "previousLink": {
        "fields": [],
        "idEquals": [],
        "previousLink": {
          "fields": [],
          "idEquals": [],
          "table": "drivertable"
        },
        "table": "mission"
      },
      "table": "driver_aud"
    } )

  } )
  it ( "should parse .drive!fullDrive[f1,f2].(id1=id2)mission[f3].(id3=id4)audit", () => {
    expect ( pl ( ".driver[f1,f2].mission.audit", 11 ) ).toEqual ( {
      "fields": [],
      "previousLink": {
        "fields": [],
        "previousLink": {
          "fields": [ "f1", "f2" ],
          "table": "drivertable",
          "idEquals": [],
        },
        "table": "mission",
        "idEquals": [],
      },
      "table": "driver_aud",
      "idEquals": [],
    } )
  } )
} )

describe ( "parsePath", () => {
  it ( "should parse a simple path", () => {
    expect ( parsePath ( PathValidatorAlwaysOK ) ( "driver" ) ).toEqual ( {
      "fields": [],
      "table": "driver"
    } )
  } )
  it ( "should parse a complex path", () => {

    expect ( parsePath ( validator ) ( "driver.(id1=id2)mission.audit[f3,f4]" ) ).toEqual ( {
      "fields": [ "f3", "f4" ], "idEquals": [],
      "previousLink": {
        "fields": [],
        "idEquals": [ { "fromId": "id1", "toId": "id2" } ],
        "previousLink": {
          "fields": [],
          "table": "drivertable"
        },
        "table": "mission"
      },
      "table": "driver_aud"
    } )
  } )
  describe ( "error message", () => {
    it ( "should process a()", () => {
      expect ( parsePath ( validator ) ( "a()" ) ).toEqual ( [
        "a()",
        " ^",
        "Expected '.'"
      ] )
    } )
    it ( "should process a.()", () => {
      expect ( parsePath ( validator ) ( "a.()" ) ).toEqual ( [
        "a.()",
        "   ^",
        "Expected a 'from id'='to id' unexpected character )"
      ] )
    } )
    it ( "should process a.[]", () => {
      expect ( parsePath ( validator ) ( "a.[]" ) ).toEqual ( [
        "a.[]",
        "  ^",
        "Expected a table name unexpected character ["
      ] )
    } )
    it ( "should process a.(noequals)b", () => {
      expect ( parsePath ( validator ) ( "a.(noequals)b" ) ).toEqual ( [
        "a.(noequals)b",
        "           ^",
        "Expected = unexpected character )"
      ] )
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
        return idEquals
      },
      actualTableName ( tableName: string ): string {
        remembered.push ( `actualTableName(${tableName})` )
        return tableName
      }
    }
    parsePath ( rem ) ( "driver.(id1=id2)mission.audit[f3,f4]" )
    expect ( remembered.sort () ).toEqual ( [
      "actualTableName(audit)",
      "actualTableName(driver)",
      "actualTableName(mission)",
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
    expect ( parsePath ( pv ) ( "driver.(id1=id2)mission.audit" ) ).toEqual ( [
      "driver.(id1=id2)mission.audit",
      "                ^",
      "link driver.mission error [{\"fromId\":\"id1\",\"toId\":\"id2\"}]"
    ] )
  } )

} )