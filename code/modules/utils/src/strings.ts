export function cleanLineEndings ( text: string ) {
  return text.replace ( /((?<!\r)\n|\r(?!\n))/g, '\r\n' )
}

export function orEmptyStringFn<T> ( fn: ( t: T | undefined ) => string | undefined ): ( t: T ) => string {
  return ( t: T | undefined ) => t === undefined ? '' : fn ( t ) || ''
}
