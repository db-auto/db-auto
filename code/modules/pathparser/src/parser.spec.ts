import { errorData, parseLink, parseTableAndLinks, ParserContext, parseTable, RawTableResult, parsePath, PathValidatorAlwaysOK } from "./parser";
import { tokenise } from "./tokeniser";


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
function pl ( s: string, consume: number, pt?: RawTableResult ) {
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