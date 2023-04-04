export function deepSort ( t: any ): any {
  if ( Array.isArray ( t ) ) return t.map ( deepSort ).sort ()
  if ( typeof t === 'object' ) {
    const res: any = {}
    Object.entries ( t ).sort ( ( a, b ) => a[ 0 ].toString ().localeCompare ( b[ 0 ].toString () ) ).forEach ( kv => res[ kv[ 0 ] ] = deepSort ( kv[ 1 ] ) )
    return res
  }
  return t

}


export function deepSortNames ( t: any ): any {
  if ( Array.isArray ( t ) ) return t.map ( deepSortNames ).sort ()
  if ( typeof t === 'object' ) {
    const res: any = {}
    Object.entries ( t ).sort ( ( a, b ) => a[ 0 ].toString ().localeCompare ( b[ 0 ].toString () ) ).forEach ( kv => res[ kv[ 0 ] ] = deepSortNames ( kv[ 1 ] ) )
    return res
  }
  return t

}
