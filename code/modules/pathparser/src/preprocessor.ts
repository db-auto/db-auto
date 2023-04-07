import { ErrorsAnd } from "@dbpath/utils";

export function preprocessor ( idFn: ( s: string ) => string, s: string ): ErrorsAnd<string> {
    try {
        return s.replace ( /([a-zA-Z0-9_])+!/g, id => idFn ( id.substring ( 0, id.length - 1 ) ) as string )
    } catch ( e ) {
        return [ e ]
    }
}
