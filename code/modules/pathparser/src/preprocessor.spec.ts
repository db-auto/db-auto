import { preprocessor } from "./preprocessor";


describe ( "preprocessor", () => {
  it ( "should pass through normal strings", () => {
    const string = "asd.sdf()d[]$%";
    expect ( preprocessor ( s => {throw Error ( 'dont call' )}, string ) ).toEqual ( string )
  } )
  it ( "should replace identifier! with the value from the idFn", () => {
    expect ( preprocessor ( s => s + 'x', "one!.two[]!three!" ) ).toEqual ( "onex.two[]!threex" )
  } )
  it ( "should return throw errors as string[] if it occurs", () => {
    expect ( preprocessor ( s => {throw s}, 'one!.two!' ) ).toEqual ( [ 'one'] )

  } )
} )