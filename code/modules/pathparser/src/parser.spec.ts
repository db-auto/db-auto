import { errorData, ParserContext, parseTable } from "./parser";
import { tokenise } from "./tokeniser";


function makeContext ( s: string ): ParserContext {
  return {
    tokens: tokenise ( "junk." + s ),
    pos: 2
  }
}
describe ( "parseTable", () => {


  function pt ( s: string, consume: number ) {
    let initialContext = makeContext ( s )
    let { context, result, error } = parseTable ( initialContext );
    if ( error ) throw error
    expect ( context.pos - initialContext.pos ).toEqual ( consume );
    return result
  }
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
    expect ( pt ( "driver[field1]", 3 ) ).toEqual ( { table: "driver", fields: [ "field1" ] } )
    expect ( pt ( "driver[field1,field2]", 5 ) ).toEqual ( { table: "driver", fields: [ "field1", "field2" ] } )
  } )
  it ( "should parse drive!drivertable[field1,field2]", () => {
    expect ( pt ( "driver[field1,field2]", 5 ) ).toEqual ( { table: "driver", fields: [ "field1", "field2" ] } )
  } )
  it ( "should report nice error messages", () => {
    // expect ( ptError ( "driver!", 7 ) ).toEqual ( ["Expected a full table name but got to end"] );
    expect ( ptError ( "driver![", 7 ) ).toEqual ( [ "Expected a full table name unexpected character [" ] );
    expect ( ptError ( "driver!dt[", 10 ) ).toEqual ( [ "Expected a field but got to end" ] );
    expect ( ptError ( "driver!dt[(]", 10 ) ).toEqual ( [ "Expected a field unexpected character (" ] );
  } )
} )