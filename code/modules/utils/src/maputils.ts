import { NameAnd } from "./nameAnd";


export const addNameAnd2 = <V> ( obj: NameAnd<NameAnd<V>> ) => ( name1: string, name2: string, v: V ) => {
  if ( !obj[ name1 ] ) {
    obj[ name1 ] = {};
  }
  obj[ name1 ][ name2 ] = v;
};