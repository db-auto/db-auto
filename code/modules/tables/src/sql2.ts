import { isLinkInPath, PathItem } from "@dbpath/types";


const mapOverPath = <T> ( p: PathItem, fn: ( p: PathItem ) => T ): T[] =>
  isLinkInPath ( p ) ? [ fn ( p ), ...mapOverPath ( p.previousLink, fn ) ] : [ fn ( p ) ];
export function sqlFor ( p: PathItem ) {

}