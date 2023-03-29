import { errorData, parseLink, parsePath, ParserContext, parseTable } from "./parser";
import { tokenise } from "./tokeniser";
import { PathValidator, PathValidatorAlwaysOK, TwoIds } from "@dbpath/dal";
import { TableInPath } from "./path";


function makeContext ( s: string ): ParserContext {
  return {
    tokens: tokenise ( "junk." + s ),
    pos: 2,
    validator: PathValidatorAlwaysOK
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
    expect ( pt ( "driver", 1 ) ).toEqual ( { table: "driver", fields: [] } )
    expect ( pt ( "driver.", 1 ) ).toEqual ( { table: "driver", fields: [] } )
  } )
  it ( "should parse drive!drivertable", () => {
    expect ( pt ( "driver!drivertable", 3 ) ).toEqual ( { table: "driver", "fullTable": "drivertable", fields: [] } )
    expect ( pt ( "driver!drivertable,", 3 ) ).toEqual ( { table: "driver", "fullTable": "drivertable", fields: [] } )
  } )
  it ( "should parse driver[field1,field2]", () => {
    expect ( pt ( "driver[field1]", 4 ) ).toEqual ( { table: "driver", fields: [ "field1" ] } )
    expect ( pt ( "driver[field1,field2]", 6 ) ).toEqual ( { table: "driver", fields: [ "field1", "field2" ] } )
  } )
  it ( "should parse drive!drivertable[field1,field2]", () => {
    expect ( pt ( "driver[field1,field2]", 6 ) ).toEqual ( { table: "driver", fields: [ "field1", "field2" ] } )
  } )
  it ( "should report nice error messages", () => {
    // expect ( ptError ( "driver!", 7 ) ).toEqual ( ["Expected a full table name but got to end"] );
    expect ( ptError ( "driver![", 7 ) ).toEqual ( [ "Expected a full table name unexpected character [" ] );
    expect ( ptError ( "driver!dt[", 10 ) ).toEqual ( [ "Expected a field but got to end" ] );
    expect ( ptError ( "driver!dt[(]", 10 ) ).toEqual ( [ "Expected a field unexpected character (" ] );
  } )
} )

describe ( "parseLink", () => {
  it ( "should parse .drive", () => {
    expect ( pl ( ".driver", 2 ) ).toEqual ( { table: "driver", fields: [], "idEquals": [], } )
    expect ( pl ( ".driver,", 2 ) ).toEqual ( { table: "driver", fields: [], "idEquals": [], } )
  } )
  it ( "should parse .drive!name[f1,f2]", () => {
    const previousTable = pt ( "someTable", 1 )
    expect ( pl ( ".driver!name[f1,f2]!!", 9, previousTable ) ).toEqual ( {
      "fullTable": "name",
      "table": "driver",
      "fields": [ "f1", "f2" ],
      previousTable,
      "idEquals": [],
    } )
  } )

  it ( "should parse .drive.mission.audit", () => {
    expect ( pl ( ".drive.mission.audit", 6 ) ).toEqual ( {
      "fields": [],
      "idEquals": [],
      "previousTable": {
        "fields": [],
        "idEquals": [],
        "previousTable": {
          "fields": [],
          "idEquals": [],
          "table": "drive"
        },
        "table": "mission"
      },
      "table": "audit"
    } )
  } )
  it ( "should parse .(id1=id2)drive", () => {
    expect ( pl ( ".(id1=id2)drive", 7 ) ).toEqual ( {
      "fields": [],
      "idEquals": [
        {
          "fromId": "id1",
          "toId": "id2"
        }
      ],
      "table": "drive"
    } )
  } )

  it ( "should parse .drive!fullDrive.mission.audit", () => {
    expect ( pl ( ".drive!fullDrive.mission.audit", 8 ) ).toEqual ( {
      "fields": [],
      "idEquals": [],
      "previousTable": {
        "fields": [],
        "idEquals": [],
        "previousTable": {
          "fields": [],
          "fullTable": "fullDrive",
          "idEquals": [],
          "table": "drive"
        },
        "table": "mission"
      },
      "table": "audit"
    } )

  } )
  it ( "should parse .drive!fullDrive[f1,f2].(id1=id2)mission[f3].(id3=id4)audit", () => {
    expect ( pl ( ".drive!full[f1,f2].mission.audit", 13 ) ).toEqual ( {
      "fields": [],
      "previousTable": {
        "fields": [],
        "previousTable": {
          "fields": [ "f1", "f2" ],
          "fullTable": "full",
          "table": "drive",
          "idEquals": [],
        },
        "table": "mission",
        "idEquals": [],
      },
      "table": "audit",
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

    expect ( parsePath ( PathValidatorAlwaysOK ) ( "driver!full.(id1=id2)mission.audit[f3,f4]" ) ).toEqual ( {
      "fields": [
        "f3",
        "f4"
      ],
      "idEquals": [
        {
          "fromId": "id1",
          "toId": "id2"
        }
      ],
      "previousTable": {
        "fields": [],
        "idEquals": [
          {
            "fromId": "id1",
            "toId": "id2"
          }
        ],
        "previousTable": {
          "fields": [],
          "fullTable": "full",
          "table": "driver"
        },
        "table": "mission"
      },
      "table": "audit"
    } )
  } )
  describe ( "error message", () => {
    it ( "should process a()", () => {
      expect ( parsePath ( PathValidatorAlwaysOK ) ( "a()" ) ).toEqual ( [
        "a()",
        " ^",
        "Expected '.'"
      ] )
    } )
    it ( "should process a.()", () => {
      expect ( parsePath ( PathValidatorAlwaysOK ) ( "a.()" ) ).toEqual ( [
        "a.()",
        "   ^",
        "Expected a 'from id'='to id' unexpected character )"
      ] )
    } )
    it ( "should process a.[]", () => {
      expect ( parsePath ( PathValidatorAlwaysOK ) ( "a.[]" ) ).toEqual ( [
        "a.[]",
        "  ^",
        "Expected a table name unexpected character ["
      ] )
    } )
    it ( "should process a.(noequals)b", () => {
      expect ( parsePath ( PathValidatorAlwaysOK ) ( "a.(noequals)b" ) ).toEqual ( [
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
      validateTableName ( tableName: string, fullTableName: string ): string[] {
        remembered.push ( `vTable(${tableName},${fullTableName})` )
        return [];
      },
      useIdsOrSingleFkLinkOrError: ( fromTableName, toTableName, idEquals ) => {
        remembered.push ( `useIdsOrSingleFkLinkOrError(${fromTableName},${toTableName}) ${idEquals}` )
        return idEquals
      }
    }
    parsePath ( rem ) ( "driver!full.(id1=id2)mission.audit[f3,f4]" )
    expect ( remembered.sort () ).toEqual ( [
      "vFields(audit)[f3,f4]",
      "vFields(driver)[]",
      "vFields(mission)[]",
      "vLink(driver,mission)[id1=id2]",
      "vLink(mission,audit)[]",
      "vTable(audit,undefined)",
      "vTable(driver,full)",
      "vTable(mission,undefined)"
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