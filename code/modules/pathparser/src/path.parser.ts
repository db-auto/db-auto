import { ErrorsAnd, hasErrors } from "@dbpath/utils";
import { PathValidator } from "@dbpath/dal";
import { LinkInPath, PathItem, TableInPath, TwoIds } from "@dbpath/types";
import { identifier, isNextChar, lift, liftError, mapParser, nextChar, parseBracketedCommaSeparated, Parser, ParserContext, parserErrorMessage, ResultAndContext, tokenise, validateAndReturn } from "@dbpath/parser";

export interface SchemaAndTable {
  schema?: string
  table: string
  fullTable?: string
}

export type Result = TableInPath;
export const pathParseSpecialCharsForTokenise = "[]{},.=:`";

export interface PathParserContext extends ParserContext {
  validator: PathValidator
}
export type PathParser<R> = Parser<PathParserContext, R>
export type PathResultAndContext<R> = ResultAndContext<PathParserContext, R>
export const parseIdEqualsId = ( c: PathParserContext ): PathResultAndContext<TwoIds> =>
  mapParser ( identifier ( "'from id'='to id'" ) ( c ), ( c, fromId ) => {
    if ( isNextChar ( c, '=' ) )
      return mapParser ( nextChar ( c, '=' ), c =>
        mapParser ( identifier ( "'to id'" ) ( c ), ( c, toId ) =>
          lift ( c, { fromId, toId } ) ) );
    else
      return lift ( c, { fromId, toId: fromId } )
  } );

export const parseSchemaAndTable = ( context: PathParserContext ): PathResultAndContext<SchemaAndTable> => {
  return mapParser ( identifier ( 'schema or table' ) ( context ), ( c, schemaOrTable ) => {
    if ( isNextChar ( c, ":" ) ) {
      return mapParser ( nextChar ( c, ':' ), c =>
        mapParser ( identifier ( 'tableName' ) ( c ), ( c, table ) => {
          let result: SchemaAndTable = { schema: schemaOrTable, table };
          return lift ( c, result );
        } ) )
    }
    return lift ( c, { table: schemaOrTable } )
  } )
}
export function parseSchemaAndTableNameAdjustingForSummary ( context: PathParserContext ): PathResultAndContext<SchemaAndTable> {
  return mapParser ( parseSchemaAndTable ( context ), ( c, schemaAndTable ) => {
    const table = context.validator.actualTableName ( schemaAndTable.table );
    return validateAndReturn ( context, c, { ...schemaAndTable, table }, c.validator.validateTableName ( table ) )
  } )
}


export const parseTable = ( context: PathParserContext ): PathResultAndContext<TableInPath> =>
  mapParser ( parseSchemaAndTableNameAdjustingForSummary ( context ), ( cEndOfTable, tableName ) =>
    mapParser ( parseBracketedCommaSeparated ( cEndOfTable, '[', ',', identifier ( 'field' ), ']' ), ( c, fields ) =>
      validateAndReturn ( cEndOfTable, c, { ...tableName, fields, pk: c.validator.pkFor ( tableName.table ) }, c.validator.validateFields ( tableName.table, fields ) ) ) );

export const parseTableAndNextLink = ( previousLink: TableInPath | undefined, idEquals: TwoIds[] ): PathParser<LinkInPath> => ( context: PathParserContext ) =>
  mapParser<PathParserContext, TableInPath, LinkInPath> ( parseTable ( context ), ( c, table ) => {
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
    mapParser ( parseBracketedCommaSeparated ( c, "{", ',', parseIdEqualsId, '}' ), ( c, idEquals ) =>
      parseTableAndNextLink ( previousTable, idEquals ) ( c ) ) )

export const parseTableAndLinks: PathParser<PathItem> = c =>
  mapParser ( parseTable ( c ), ( c, previousLink ) => {
    if ( isNextChar ( c, '.' ) ) {
      const linkInPathResultAndContext: PathResultAndContext<PathItem> = parseLink ( previousLink ) ( c );
      return linkInPathResultAndContext;
    } else return lift ( c, previousLink )
  } )


export const parsePath = ( validator: PathValidator ) => ( s: string ): ErrorsAnd<LinkInPath | TableInPath> => {
  const tokens = tokenise ( pathParseSpecialCharsForTokenise ) ( s )
  const errorTokens = tokens.filter ( t => t.type === 'error' )
  if ( errorTokens.length > 0 ) return [ 'sort out tokeniser issues' ]
  const c: PathParserContext = { pos: 0, tokens, validator }
  const { context, errors, result } = parseTableAndLinks ( c )
  if ( errors ) return parserErrorMessage ( s, context, errors );
  if ( context.pos < tokens.length - 1 )
    return parserErrorMessage ( s, context, [ "Expected '.'" ] )
  return result
};

