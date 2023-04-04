import { Token, tokenise } from "./tokeniser";
import { ErrorsAnd, hasErrors } from "@dbpath/utils";
import { PathValidator } from "@dbpath/dal";
import { LinkInPath, PathItem, TableInPath, TwoIds } from "@dbpath/types";

export interface SchemaAndTable {
  schema?: string
  table: string
  fullTable?: string
}

export type Result = TableInPath;

export interface ParserContext {
  tokens: Token[ ]
  pos: number
  validator: PathValidator
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

function validateAndReturn<T> ( cError: ParserContext, c: ParserContext, t: T, errors: string[] ): ResultAndContext<T> {
  return errors.length ? liftError ( cError, errors ) : lift ( c, t );
}
function lift<R> ( context: ParserContext, result: R ): ResultAndContext<R> {
  return { context, result }
}
function liftError<R> ( context: ParserContext, error: string[] ): ResultAndContext<R> {
  return { context, error }
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
  if ( token?.type === 'char' && token.value === ch ) {
    return { result: undefined, context: { ...c, pos } };
  } else {
    return liftError ( c, [ `Expected ${ch} ${gotForError ( c )}` ] )
  }
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
        mapParser ( parseCommaSeparated<R> ( c, comma, parser ), ( c, ids ) =>
          lift ( c, [ r, ...ids ] ) ) )
    else
      return lift ( c, [ r ] )
  } )
}

export type PathParser<R> = ( c: ParserContext ) => ResultAndContext<R>

export function parseBracketedCommaSeparated<R> ( c: ParserContext, open: string, comma: string, parser: PathParser<R>, close: string ): ResultAndContext<R[]> {
  if ( isNextChar ( c, open ) ) {
    return mapParser ( nextChar ( c, open ), ( c ) =>
      mapParser ( parseCommaSeparated ( c, comma, parser ), ( c, ids ) => {
        return mapParser ( nextChar ( c, close ), c => {
          return lift ( c, ids )
        } )
      } ) )
  }
  return lift ( c, [] )
}


export const parseIdEqualsId = ( c: ParserContext ): ResultAndContext<TwoIds> =>
  mapParser ( identifier ( "'from id'='to id'" ) ( c ), ( c, fromId ) => {
    if ( isNextChar ( c, '=' ) )
      return mapParser ( nextChar ( c, '=' ), c =>
        mapParser ( identifier ( "'to id'" ) ( c ), ( c, toId ) =>
          lift ( c, { fromId, toId } ) ) );
    else
      return lift ( c, { fromId, toId: fromId } )
  } );

export const parseSchemaAndTable = ( context: ParserContext ): ResultAndContext<SchemaAndTable> => {
  return mapParser ( identifier ( 'schema or table' ) ( context ), ( c, schemaOrTable ) => {
    if ( isNextChar ( c, "#" ) ) {
      return mapParser ( nextChar ( c, '#' ), c =>
        mapParser ( identifier ( 'tableName' ) ( c ), ( c, table ) => {
          let result: SchemaAndTable = { schema: schemaOrTable, table };
          return lift ( c, result );
        } ) )
    }
    return lift ( c, { table: schemaOrTable } )
  } )
}
export function parseSchemaAndTableNameAdjustingForSummary ( context: ParserContext ): ResultAndContext<SchemaAndTable> {
  return mapParser ( parseSchemaAndTable ( context ), ( c, schemaAndTable ) => {
    const table = context.validator.actualTableName ( schemaAndTable.table );
    return validateAndReturn ( context, c, { ...schemaAndTable, table }, c.validator.validateTableName ( table ) )
  } )
}


export const parseTable = ( context: ParserContext ): ResultAndContext<TableInPath> =>
  mapParser ( parseSchemaAndTableNameAdjustingForSummary ( context ), ( cEndOfTable, tableName ) =>
    mapParser ( parseBracketedCommaSeparated ( cEndOfTable, '[', ',', identifier ( 'field' ), ']' ), ( c, fields ) =>
      validateAndReturn ( cEndOfTable, c, { ...tableName, fields, pk: c.validator.pkFor ( tableName.table ) }, c.validator.validateFields ( tableName.table, fields ) ) ) );

export const parseTableAndNextLink = ( previousLink: TableInPath | undefined, idEquals: TwoIds[] ): PathParser<LinkInPath> => context =>
  mapParser<TableInPath, LinkInPath> ( parseTable ( context ), ( c, table ) => {
    const realIdEquals = c.validator.useIdsOrSingleFkLinkOrError ( previousLink?.table, table.table, idEquals )
    if ( hasErrors ( realIdEquals ) ) return liftError ( context, realIdEquals ) as any
    let thisLink = { ...table, idEquals: realIdEquals.twoIds, previousLink }
    const errors = c.validator.validateLink ( previousLink?.table, table.table, realIdEquals.twoIds )
    if ( errors.length > 0 ) return liftError ( context, errors )
    return isNextChar ( c, '.' )
      ? parseLink ( thisLink ) ( c )
      : lift ( c, thisLink );
  } );
export const parseLink = ( previousTable: TableInPath | undefined ): PathParser<LinkInPath> =>
  c => mapParser ( nextChar ( c, '.' ), c =>
    mapParser ( parseBracketedCommaSeparated ( c, "(", ',', parseIdEqualsId, ')' ), ( c, idEquals ) =>
      parseTableAndNextLink ( previousTable, idEquals ) ( c ) ) )

export const parseTableAndLinks: PathParser<PathItem> = c =>
  mapParser ( parseTable ( c ), ( c, previousLink ) => {
    if ( isNextChar ( c, '.' ) ) {
      const linkInPathResultAndContext: ResultAndContext<PathItem> = parseLink ( previousLink ) ( c );
      return linkInPathResultAndContext;
    } else return lift ( c, previousLink )
  } )

function errorMessage ( s: string, c: ParserContext, errors: string[] ) {
  const posFromToken = c.tokens[ c.pos ]?.pos
  const pos = posFromToken ? posFromToken : s.length
  return [ s, '^'.padStart ( pos + 1 ), ...errors ]
}

export const parsePath = ( validator: PathValidator ) => ( s: string ): ErrorsAnd<LinkInPath | TableInPath> => {
  const tokens = tokenise ( s )
  const errorTokens = tokens.filter ( t => t.type === 'error' )
  if ( errorTokens.length > 0 ) return [ 'sort out tokeniser issues' ]
  const c: ParserContext = { pos: 0, tokens, validator }
  const { context, error, result } = parseTableAndLinks ( c )
  if ( error ) return errorMessage ( s, context, error );
  if ( context.pos < tokens.length - 1 )
    return errorMessage ( s, context, [ "Expected '.'" ] )
  return result
};

export function errorData<R> ( pr: ResultAndContext<R>, s: string ) {
  let token = pr.context.tokens[ pr.context.pos ];
  let pos = token ? token.pos : s.length;
  return { error: pr.error, token, pos, s };
}