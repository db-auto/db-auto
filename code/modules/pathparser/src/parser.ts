import { Token } from "./tokeniser";

export interface RawTableResult {
  table: string
  fullTable?: string
  fields?: string[ ]
};
export interface RawLinkWithoutIdEqualsResult extends RawTableResult {
  previousLink?: RawLinkResult
}
export interface RawLinkResult extends RawLinkWithoutIdEqualsResult {

  idEquals: TwoIds[]
};

export type Result = RawTableResult;

export interface ParserContext {
  tokens: Token[ ]
  pos: number
}
interface ResultAndContext<R> {
  result?: R
  context: ParserContext
  error?: string[]
}

export const identifier = ( type: string ) => ( context: ParserContext ): ResultAndContext<string> => {
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

function mapParser<T, T1> ( c: ResultAndContext<T>, f: ( c: ParserContext, t: T ) => ResultAndContext<T1> ): ResultAndContext<T1> {
  if ( c.error ) return c as any;
  let result = f ( c.context, c.result );
  return result;
}

function isNextChar ( c: ParserContext, ch: string ): boolean {
  const tokens = c.tokens;
  let token = tokens[ c.pos ];
  return token?.type === 'char' && token.value === ch;
}
function nextChar ( c: ParserContext, ch: string ): ResultAndContext<undefined> {
  var pos = c.pos;
  const tokens = c.tokens;
  let token = tokens[ pos++ ];
  if ( token.type === 'char' && token.value === ch ) {
    return { result: undefined, context: { ...c, pos } };
  } else {
    return { context: c, error: [ `Expected ${ch} ${gotForError ( c )}` ] };
  }
}

export interface TableAndFullTableName {
  table: string
  fullTable?: string
}

export function gotForError ( c: ParserContext ): string {
  let token = c.tokens[ c.pos ];
  if ( token === undefined ) return 'end of path';
  if ( token.type === 'char' ) return 'unexpected character ' + token.value;
  if ( token.type === 'string' ) return 'unexpected string ' + token.value;
  if ( token.type === 'error' ) throw new Error ( `Unexpected error token\n${JSON.stringify ( token )}` );
}

export function parseCommaSeparated<R> ( c: ParserContext, comma: string, parser: PathParser<R> ): ResultAndContext<R[]> {
  return mapParser ( parser ( c ), ( c, r ) => {
    if ( isNextChar ( c, comma ) )
      return mapParser ( nextChar ( c, comma ), ( c ) =>
        mapParser ( parseCommaSeparated<R> ( c, comma, parser ), ( c, ids ) => {
          return { result: [ r, ...ids ], context: c };
        } ) )
    else
      return { result: [ r ], context: c };
  } )
}

export type PathParser<R> = ( c: ParserContext ) => ResultAndContext<R>

export function parseBracketedCommaSeparated<R> ( c: ParserContext, open: string, comma: string, parser: PathParser<R>, close: string ): ResultAndContext<R[]> {
  if ( isNextChar ( c, open ) ) {
    return mapParser ( nextChar ( c, open ), ( c ) =>
      mapParser ( parseCommaSeparated ( c, comma, parser ), ( c, ids ) => {
        return mapParser ( nextChar ( c, close ), c => {
          return { result: ids, context: c };
        } )
      } ) )
  }
  return { context: c, result: [] }
}

export interface TwoIds {
  fromId: string,
  toId: string
}
export const parseIdEqualsId = ( c: ParserContext ): ResultAndContext<TwoIds> =>
  mapParser ( identifier ( 'from id' ) ( c ), ( c, fromId ) =>
    mapParser ( nextChar ( c, '=' ), c =>
      mapParser ( identifier ( 'to id' ) ( c ), ( c, toId ) =>
        ({ context: c, result: { fromId, toId } }) ) ) );
export function parseTableName ( c: ParserContext ): ResultAndContext<TableAndFullTableName> {
  return mapParser ( identifier ( 'table name' ) ( c ), ( c, tableName ) => {
    if ( isNextChar ( c, '!' ) ) {
      return mapParser ( nextChar ( c, '!' ), ( c ) =>
        mapParser ( identifier ( 'full table name' ) ( c ), ( context, fullTableName ) =>
          ({ result: { table: tableName, fullTable: fullTableName }, context }) ) )
    } else
      return { result: { table: tableName }, context: c }
  } )
}


export const parseTable = ( c: ParserContext ): ResultAndContext<RawTableResult> =>
  mapParser ( parseTableName ( c ), ( c, tableName ) =>
    mapParser ( parseBracketedCommaSeparated ( c, '[', ',', identifier ( 'field' ), ']' ), ( c, fields ) =>
      ({ result: { ...tableName, fields }, context: c }) ) );

export const parseTableAndNextLink = ( previousTable: RawTableResult | undefined, idEquals: TwoIds[] ): PathParser<RawLinkWithoutIdEqualsResult> => c =>
  mapParser<RawTableResult, RawLinkWithoutIdEqualsResult> ( parseTable ( c ), ( c, table ) => {
    let thisLink = { ...table, previousTable, idEquals };
    return isNextChar ( c, '.' )
      ? parseLink ( thisLink ) ( c )
      : { context: c, result: thisLink, idEquals };
  } );
export const parseLink = ( previousTable: RawTableResult | undefined ): PathParser<RawLinkResult> =>
  c => mapParser ( nextChar ( c, '.' ), c =>
    mapParser ( parseBracketedCommaSeparated ( c, "(", ',', parseIdEqualsId, ')' ), ( c, idEquals ) =>
      mapParser ( parseTableAndNextLink ( previousTable, idEquals ) ( c ), ( c, link ) =>
        ({ context: c, result: { ...link, idEquals } }) )
    ) )

export const parsePath: PathParser<RawLinkResult> = c =>
  mapParser ( parseTable ( c ), ( c, previousLink ) =>
    parseLink ( previousLink ) ( c ) )


export function errorData<R> ( pr: ResultAndContext<R>, s: string ) {
  let token = pr.context.tokens[ pr.context.pos ];
  let pos = token ? token.pos : s.length;
  return { error: pr.error, token, pos, s };
}