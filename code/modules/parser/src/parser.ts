import { Token } from "./tokeniser";

export type Parser<C extends ParserContext, R> = ( c: C ) => ResultAndContext<C, R>


export interface ParserContext {
  tokens: Token[ ]
  pos: number
}
export interface ResultAndContext<C extends ParserContext, R> {
  result?: R
  context: C
  error?: string[]
}
export const identifier = ( type: string ) => <C extends ParserContext> ( context: C ): ResultAndContext<C, string> => {
  var pos = context.pos;
  const tokens = context.tokens;
  let token = tokens[ pos++ ];
  if ( token === undefined ) return { context, error: [ `Expected a ${type} but got to end` ] };
  if ( token.type === 'string' ) {
    return { result: token.value, context: { ...context, pos } };
  } else {
    return { context, error: [ `Expected a ${type} ${gotForError ( context )}` ] };
  }
};
export const mapParser = <C extends ParserContext, T, T1> ( c: ResultAndContext<C, T>, f: ( c: C, t: T ) => ResultAndContext<C, T1> ): ResultAndContext<C, T1> => {
  if ( c.error ) return c as any;
  let result = f ( c.context, c.result );
  return result;
};

export function validateAndReturn<C extends ParserContext, T> ( cError: C, c: C, t: T, errors: string[] ): ResultAndContext<C, T> {
  return errors.length ? liftError ( cError, errors ) : lift ( c, t );
}
export function lift<C extends ParserContext, R> ( context: C, result: R ): ResultAndContext<C, R> {
  return { context, result }
}
export function liftError<C extends ParserContext, R> ( context: C, error: string[] ): ResultAndContext<C, R> {
  return { context, error }
}
export function isNextChar<C extends ParserContext> ( c: C, ch: string ): boolean {
  const tokens = c.tokens;
  let token = tokens[ c.pos ];
  return token?.type === 'char' && token.value === ch;
}
export const foldNextChar = <C extends ParserContext, R> ( c: C, ch: string, ifTrue: Parser<C, R>, ifFalse: Parser<C, R> ): ResultAndContext<C, R> =>
  isNextChar ( c, ch ) ? ifTrue ( c ) : ifFalse ( c );

export function nextChar<C extends ParserContext> ( c: C, ch: string ): ResultAndContext<C, string> {
  var pos = c.pos;
  const tokens = c.tokens;
  let token = tokens[ pos++ ];
  return token?.type === 'char' && token.value === ch
    ? { result: ch, context: { ...c, pos } }
    : liftError ( c, [ `Expected ${ch} ${gotForError ( c )}` ] );
}
export function gotForError<C extends ParserContext> ( c: C ): string {
  let token = c.tokens[ c.pos ];
  if ( token === undefined ) return 'end of path';
  if ( token.type === 'char' ) return 'unexpected character ' + token.value;
  if ( token.type === 'string' ) return 'unexpected string ' + token.value;
  if ( token.type === 'error' ) throw new Error ( `Unexpected error token\n${JSON.stringify ( token )}` );
}

export function parseCommaSeparated<C extends ParserContext, R> ( c: C, comma: string, parser: Parser<C, R> ): ResultAndContext<C, R[]> {
  return mapParser ( parser ( c ), ( c, r ) => foldNextChar ( c, comma,
    ( c ) => mapParser ( nextChar ( c, comma ), ( c ) =>
      mapParser ( parseCommaSeparated<C, R> ( c, comma, parser ), ( c, ids ) =>
        lift ( c, [ r, ...ids ] ) ) ),
    ( c ) => lift ( c, [ r ] ) ) )
}


export function parseBracketedCommaSeparated<C extends ParserContext, R> ( c: C, open: string, comma: string, parser: Parser<C, R>, close: string ): ResultAndContext<C, R[]> {
  return foldNextChar ( c, open, c => mapParser ( nextChar ( c, open ), ( c ) =>
    mapParser ( parseCommaSeparated ( c, comma, parser ), ( c, ids ) =>
      mapParser ( nextChar ( c, close ), c => {
        return lift ( c, ids )
      } ) ) ), ( c ) => lift ( c, [] ) )
}


export function parserErrorMessage ( s: string, c: ParserContext, errors: string[] ) {
  const posFromToken = c.tokens[ c.pos ]?.pos
  const pos = posFromToken ? posFromToken : s.length
  return [ s, '^'.padStart ( pos + 1 ), ...errors ]
}
/** To help tests */

