import { Token, tokenise } from "./tokeniser";
import { errors, ErrorsAnd, hasErrors, Validator } from "@dbpath/utils";


export type ValidateTableNameFn = ( tableName: string, fullTableName?: string ) => string[]
export type ValidateFieldsFn = ( tableName: string, fields: string[] ) => string[]
export type ValidateLinkFn = ( fromTableName: string, toTableName: string, idEquals: TwoIds[] ) => string[]
/** These will be called at suitable times during parsing
 * The table name in driver!driver_table would be 'driver', so the valdiation has to handle summaries
 */

export interface PathValidator {
  validateTableName: ValidateTableNameFn,
  validateFields: ValidateFieldsFn,
  validateLink: ValidateLinkFn
}

export const PathValidatorAlwaysOK: PathValidator = {
  validateTableName: (): string[] => [],
  validateFields: (): string[] => [],
  validateLink: () => []
}

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

export interface TwoIds {
  fromId: string,
  toId: string
}
export const parseIdEqualsId = ( c: ParserContext ): ResultAndContext<TwoIds> =>
  mapParser ( identifier ( "'from id'='to id'" ) ( c ), ( c, fromId ) =>
    mapParser ( nextChar ( c, '=' ), c =>
      mapParser ( identifier ( "'to id'" ) ( c ), ( c, toId ) =>
        lift ( c, { fromId, toId } ) ) ) );
export function parseTableName ( context: ParserContext ): ResultAndContext<TableAndFullTableName> {
  return mapParser ( identifier ( 'table name' ) ( context ), ( c, tableName ) => {
    if ( isNextChar ( c, '!' ) ) {
      return mapParser ( nextChar ( c, '!' ), ( c ) =>
        mapParser ( identifier ( 'full table name' ) ( c ), ( c, fullTableName ) =>
          validateAndReturn ( context, c, { table: tableName, fullTable: fullTableName }, context.validator.validateTableName ( tableName, fullTableName ) )
        ) )
    } else
      return validateAndReturn ( context, c, { table: tableName }, c.validator.validateTableName ( tableName ) )
  } )
}


export const parseTable = ( context: ParserContext ): ResultAndContext<RawTableResult> =>
  mapParser ( parseTableName ( context ), ( cEndOfTable, tableName ) =>
    mapParser ( parseBracketedCommaSeparated ( cEndOfTable, '[', ',', identifier ( 'field' ), ']' ), ( c, fields ) =>
      validateAndReturn ( cEndOfTable, c, { ...tableName, fields }, c.validator.validateFields ( tableName.table, fields ) ) ) );

export const parseTableAndNextLink = ( previousTable: RawTableResult | undefined, idEquals: TwoIds[] ): PathParser<RawLinkWithoutIdEqualsResult> => context =>
  mapParser<RawTableResult, RawLinkWithoutIdEqualsResult> ( parseTable ( context ), ( c, table ) => {
    let thisLink = { ...table, previousTable, idEquals };
    const errors = c.validator.validateLink ( previousTable?.table, table.table, idEquals )
    if ( errors.length > 0 ) return liftError ( context, errors )
    return isNextChar ( c, '.' )
      ? parseLink ( thisLink ) ( c )
      : lift ( c, thisLink );
  } );
export const parseLink = ( previousTable: RawTableResult | undefined ): PathParser<RawLinkResult> =>
  c => mapParser ( nextChar ( c, '.' ), c =>
    mapParser ( parseBracketedCommaSeparated ( c, "(", ',', parseIdEqualsId, ')' ), ( c, idEquals ) =>
      mapParser ( parseTableAndNextLink ( previousTable, idEquals ) ( c ), ( c, link ) =>
        lift ( c, { ...link, idEquals } ) ) ) )

export const parseTableAndLinks: PathParser<RawLinkResult | RawTableResult> = c =>
  mapParser ( parseTable ( c ), ( c, previousLink ) => {
    if ( isNextChar ( c, '.' ) )
      return parseLink ( previousLink ) ( c );
    else return lift ( c, previousLink )
  } )

function errorMessage ( s: string, c: ParserContext, errors: string[] ) {
  const posFromToken = c.tokens[ c.pos ]?.pos
  const pos = posFromToken ? posFromToken : s.length
  return [ s, '^'.padStart ( pos + 1 ), ...errors ]
}

export const parsePath = ( validator: PathValidator ) => ( s: string ): ErrorsAnd<RawLinkResult | RawTableResult> => {
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