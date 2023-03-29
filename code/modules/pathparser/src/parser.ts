import { Token, tokenise } from "./tokeniser";

export interface RawTableResult {
  table: string
  fullTable?: string
  fields?: string[ ]
};
export interface RawLinkResult extends RawTableResult {
  previousTable?: RawTableResult
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

export function identifier ( context: ParserContext, type: string ): ResultAndContext<string> {
  var pos = context.pos;
  const tokens = context.tokens;
  let token = tokens[ pos++ ];
  if ( token === undefined ) return { context, error: [ `Expected a ${type} but got to end` ] };
  if ( token.type === 'string' ) {
    return { result: token.value, context: { ...context, pos } };
  } else {
    return { context, error: [ `Expected a ${type} ${gotForError ( context )}` ] };
  }
}

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
export function parseTableName ( c: ParserContext ): ResultAndContext<TableAndFullTableName> {
  return mapParser ( identifier ( c, 'table name' ), ( c, tableName ) => {
    if ( isNextChar ( c, '!' ) ) {
      return mapParser ( nextChar ( c, '!' ), ( c ) =>
        mapParser ( identifier ( c, 'full table name' ), ( context, fullTableName ) =>
          ({ result: { table: tableName, fullTable: fullTableName }, context }) ) )
    } else
      return { result: { table: tableName }, context: c }
  } )
}

export function parseCommaSeparatedIdentifiers ( c: ParserContext, type: string ): ResultAndContext<string[]> {
  return mapParser ( identifier ( c, type ), ( c, id ) => {
    if ( isNextChar ( c, ',' ) )
      return mapParser ( nextChar ( c, ',' ), ( c ) =>
        mapParser ( parseCommaSeparatedIdentifiers ( c, type ), ( c, ids ) => {
          return { result: [ id, ...ids ], context: c };
        } ) )
    else
      return { result: [ id ], context: c };
  } )
}

export function parseBracketedCommaSeparatedIdentifiers ( c: ParserContext, open: string, close: string ): ResultAndContext<string[]> {
  if ( isNextChar ( c, open ) ) {
    return mapParser ( nextChar ( c, open ), ( c ) =>
      mapParser ( parseCommaSeparatedIdentifiers ( c, 'field' ), ( c, ids ) => {
        return mapParser ( nextChar ( c, close ), () => {
          return { result: ids, context: c };
        } )
      } ) )
  }
  return { context: c, result: [] }
}


export function parseTable ( c: ParserContext ): ResultAndContext<RawTableResult> {
  return mapParser ( parseTableName ( c ), ( c, tableName ) =>
    mapParser ( parseBracketedCommaSeparatedIdentifiers ( c, '[', ']' ), ( c, fields ) =>
      ({ result: { ...tableName, fields }, context: c }) ) )
}


export function errorData<R> ( pr: ResultAndContext<R>, s: string ) {
  let token = pr.context.tokens[ pr.context.pos ];
  let pos = token ? token.pos : s.length;
  return { error: pr.error, token, pos, s };
}