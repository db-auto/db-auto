import { NameAnd } from "./nameAnd";


export const addNameAnd2 = <V> ( obj: NameAnd<NameAnd<V>> ) => ( name1: string, name2: string, v: V ) => {
  if ( !obj[ name1 ] ) {
    obj[ name1 ] = {};
  }
  obj[ name1 ][ name2 ] = v;
};

export function makeIntoNameAnd<T, V> ( list: T[], keyFn: ( t: T ) => string, valueFn: ( t: T ) => V ): NameAnd<V> {
  let result: NameAnd<V> = {};
  list.forEach ( t => result[ keyFn ( t ) ] = valueFn ( t ) );
  return result;
}

export function makeIntoNameAndList<T,V>( list: T[], keyFn: ( t: T ) => string, valueFn: ( t: T ) => V ): NameAnd<V[]> {
  let result: NameAnd<V[]> = {};
  list.forEach ( t => {
    let key = keyFn ( t );
    if ( !result[ key ] ) {
      result[ key ] = [];
    }
    result[ key ].push ( valueFn ( t ) );
  } );
  return result;
}

