export interface TokeniserContext {
  path: string;
  pos: number;
  thisToken: string;
}

export interface CharToken {
  type: 'char';
  value: string;
  pos: number;
}

export interface StringToken {
  type: 'string';
  value: string;
  pos: number;
}

export interface ErrorToken {
  type: 'error'
  value: string;
  pos: number;
}
export type Token = CharToken | StringToken | ErrorToken;


export interface TokenAndContext {
  token: Token;
  context: TokeniserContext;
}
const specials = "[](),.=";
export function tokeniseNext ( context: TokeniserContext ): TokenAndContext {
  const initialPos = context.pos;
  var pos = context.pos
  if ( pos >= context.path.length ) return { token: undefined, context }
  const char = context.path[ pos ];
  if ( char === '`' ) {
    pos++;
    while ( pos < context.path.length && context.path[ pos ] !== '`' ) pos++;
    return pos >= context.path.length
      ? { token: { type: 'error', value: 'Unterminated string', pos: initialPos }, context }
      : { token: { type: 'string', value: context.path.slice ( context.pos, pos + 1 ), pos: initialPos }, context: { ...context, pos: pos + 1 } };
  }
  if ( specials.includes ( char ) ) {
    return { token: { type: 'char', value: char, pos: initialPos }, context: { ...context, pos: pos + 1 } };
  } else {
    while ( pos < context.path.length && !specials.includes ( context.path[ pos ] ) ) {
      pos++;
    }
    return { token: { type: 'string', value: context.path.slice ( context.pos, pos ), pos: initialPos }, context: { ...context, pos } };
  }
}
export function tokenise ( path: string ): Token[] {
  var context: TokeniserContext = {
    path,
    pos: 0,
    thisToken: ''
  };
  const tokens: Token[] = [];
  while ( true ) {
    let { token, context: newContext } = tokeniseNext ( context );
    if ( token ) {
      tokens.push ( token );
      context = newContext
    } else return tokens;
  }

}