import { Token, TokenAndContext, tokenise, tokeniseNext, TokeniserContext } from "./tokeniser";

describe ( 'tokeniserNext', function () {
  function makeContext ( thisBit: string ): TokeniserContext {
    return {
      path: 'prefix' + thisBit,
      pos: 6,
      thisToken: ''
    }
  }
  function nt ( thisBit: string, consumed: number ): Token {
    let initialContext = makeContext ( thisBit );
    let { context, token } = tokeniseNext ( initialContext );
    if ( token?.type === 'error' )
      expect ( context ).toEqual ( initialContext );
    else
      expect ( context ).toEqual ( { ...initialContext, pos: consumed + 6 } );
    return token;
  }

  it ( "should return undefined at end", function () {
    expect ( nt ( "", 0 ) ).toEqual ( undefined );
  } )

  it ( "should return a character if [](),", () => {
      expect ( nt ( ",", 1 ) ).toEqual ( { type: 'char', value: ',', pos: 6 } );
      expect ( nt ( ",asd", 1 ) ).toEqual ( { type: 'char', value: ',', pos: 6 } );
      expect ( nt ( "[asd", 1 ) ).toEqual ( { type: 'char', value: '[', pos: 6 } );
      expect ( nt ( "]asd", 1 ) ).toEqual ( { type: 'char', value: ']', pos: 6 } );
      expect ( nt ( "(asd", 1 ) ).toEqual ( { type: 'char', value: '(', pos: 6 } );
      expect ( nt ( ")asd", 1 ) ).toEqual ( { type: 'char', value: ')', pos: 6 } );


    }
  )
  it ( "should return a string up to the next special character - not escaped", () => {
    expect ( nt ( "hello)world", 5 ) ).toEqual ( { type: 'string', value: 'hello', pos: 6 } );
    expect ( nt ( "hello(world", 5 ) ).toEqual ( { type: 'string', value: 'hello', pos: 6 } );
    expect ( nt ( "hello,world", 5 ) ).toEqual ( { type: 'string', value: 'hello', pos: 6 } );
    expect ( nt ( "hello]world", 5 ) ).toEqual ( { type: 'string', value: 'hello', pos: 6 } );
    expect ( nt ( "hello[world", 5 ) ).toEqual ( { type: 'string', value: 'hello', pos: 6 } );
    expect ( nt ( "hello.world", 5 ) ).toEqual ( { type: 'string', value: 'hello', pos: 6 } );
  } )
  it ( "should escape strings", () => {
    const txt = "`hello[,](.)!world`";
    expect ( nt ( txt + "rest", txt.length ) ).toEqual ( { type: 'string', value: txt, pos: 6 } )
    expect ( nt ( txt, txt.length ) ).toEqual ( { type: 'string', value: txt, pos: 6 } )
  } )
  it ( 'should report if the escaped string is unterminated', () => {
    const txt = "`hello[,](,)!world";
    expect ( nt ( txt + "rest", txt.length + 4 ) ).toEqual ( { type: 'error', value: 'Unterminated string', pos: 6 } )
    expect ( nt ( txt, txt.length ) ).toEqual ( { type: 'error', value: 'Unterminated string', pos: 6 } )
  } )

} );

describe ( 'tokenise', function () {
  it ( "should return an array of tokens", () => {
    expect ( tokenise ( "hello" ) ).toEqual ( [ { type: 'string', value: 'hello', pos: 0 } ] )
    expect ( tokenise ( "hello,world" ) ).toEqual ( [
      { "pos": 0, "type": "string", "value": "hello" },
      { "pos": 5, "type": "char", "value": "," },
      { "pos": 6, "type": "string", "value": "world" }
    ] )
    expect ( tokenise ( "`hello,world`[a]" ) ).toEqual ( [
      { "pos": 0, "type": "string", "value": "`hello,world`" },
      { "pos": 13, "type": "char", "value": "[" },
      { "pos": 14, "type": "string", "value": "a" },
      { "pos": 15, "type": "char", "value": "]" }
    ] )
    expect ( tokenise ( "[a]b(c)" ) ).toEqual ( [
      { "pos": 0, "type": "char", "value": "[" },
      { "pos": 1, "type": "string", "value": "a" },
      { "pos": 2, "type": "char", "value": "]" },
      { "pos": 3, "type": "string", "value": "b" },
      { "pos": 4, "type": "char", "value": "(" },
      { "pos": 5, "type": "string", "value": "c" },
      { "pos": 6, "type": "char", "value": ")" }
    ] )
    expect ( tokenise ( "[a]b(`c[](),`)" ) ).toEqual ( [
      { "pos": 0, "type": "char", "value": "[" },
      { "pos": 1, "type": "string", "value": "a" },
      { "pos": 2, "type": "char", "value": "]" },
      { "pos": 3, "type": "string", "value": "b" },
      { "pos": 4, "type": "char", "value": "(" },
      { "pos": 5, "type": "string", "value": "`c[](),`" },
      { "pos": 13, "type": "char", "value": ")" }
    ] )
  } )
} )