import { flatMap, flatten } from "./utils";


export type ErrorFn<From, To> = ( value: From ) => ErrorsAnd<To>
export type ErrorsAnd<T> = T | string[]

export function mapArrayOfErrorsAnd<T, T1> ( ts: ErrorsAnd<T>[], fn: ( ts: T[] ) => T1 ): ErrorsAnd<T1> {
  const allErrors = ts.filter ( hasErrors )
  if ( allErrors.length > 0 ) return flatten ( allErrors )
  const allResults: T[] = ts.map ( value )
  return fn ( allResults )
}

export function reportErrors<T> ( e: ErrorsAnd<T> ): ErrorsAnd<T> {
  if ( hasErrors ( e ) ) e.forEach ( e => console.error ( e ) )
  return e
}
export function hasErrors<T> ( t: ErrorsAnd<T> ): t is string[] {
  return Array.isArray ( t )
}
export function ignoreError<T> ( t: () => T ) {
  try {
    return t ()
  } catch ( e ) {
    return undefined
  }
}
export async function ignoreErrorK<T> ( t: () => Promise<T> ) {
  try {
    return await t ()
  } catch ( e ) {
    return undefined
  }
}
export function errors<T> ( t: ErrorsAnd<T> ): string[] {
  return hasErrors ( t ) ? t : []
}

export function value<T> ( t: ErrorsAnd<T> ): T | undefined {
  return hasErrors ( t ) ? undefined : t
}
export function mapErrors<T, T1> ( t: ErrorsAnd<T>, fn: ( t: T ) => ErrorsAnd<T1> ): ErrorsAnd<T1> {
  return hasErrors ( t ) ? t : fn ( t )
}

export function mapAndforEachErrorFn<T, Acc, T1> ( ts: T[], mapFn: ( t: T ) => ErrorsAnd<T1>, forEach: ( t1: T1, index: number ) => Acc ): ErrorsAnd<void> {
  const raw = ts.map ( mapFn )
  const errors = allErrorsIn ( raw )
  if ( errors.length > 0 ) return errors
  const values: T1 [] = allValuesIn ( raw )
  values.forEach ( ( t1, i ) => forEach ( t1, i ) )
}

export function allErrorsIn<T> ( ts: ErrorsAnd<T>[] ): string[] {
  return flatMap ( ts, t => hasErrors ( t ) ? errors ( t ) : [] )
}
export function allValuesIn<T> ( ts: ErrorsAnd<T>[] ): T[] {
  return flatMap ( ts, t => hasErrors ( t ) ? [] : [ t ] )
}
export function mapErrorsK<T, T1> ( t: ErrorsAnd<T>, fn: ( t: T ) => Promise<ErrorsAnd<T1>> ): Promise<ErrorsAnd<T1>> {
  return hasErrors ( t ) ? Promise.resolve ( t ) : fn ( t )
}
export function prefixAnyErrors<T> ( t: ErrorsAnd<T>, ...prefix: string[] ): ErrorsAnd<T> {
  return hasErrors ( t ) ? [ ...prefix, ...errors ( t ) ] : t
}
export function postfixAnyErrors<T> ( t: ErrorsAnd<T>, ...postfix: string[] ): ErrorsAnd<T> {
  return hasErrors ( t ) ? [ ...errors ( t ), ...postfix ] : t
}
export function flattenErrors<T> ( t: ErrorsAnd<ErrorsAnd<T>> ): ErrorsAnd<T> {
  return hasErrors ( t ) ? flatten ( t as any ) : t
}

export function flatMapErrors<T, T1> ( t: ErrorsAnd<T>, fn: ( t: T ) => ErrorsAnd<T1> ): ErrorsAnd<T1> {
  return flattenErrors ( mapErrors ( t, fn ) )
}

export function flatMapErrorsK<T, T1> ( t: ErrorsAnd<T>, fn: ( t: T ) => Promise<ErrorsAnd<T1>> ): Promise<ErrorsAnd<T1>> {
  return hasErrors ( t ) ? Promise.resolve ( t ) : fn ( t ).then ( flattenErrors )
}

export function foldErrors<Acc, T> ( ts: T[], zero: Acc, fn: ( acc: ErrorsAnd<Acc>, t: T ) => ErrorsAnd<Acc> ): ErrorsAnd<Acc> {
  return ts.reduce ( ( acc, t ) => mapErrors ( acc, acc => fn ( acc, t ) ), zero )
}

export function foldErrorsK<Acc, T> ( ts: T[], zero: Acc, fn: ( acc: ErrorsAnd<Acc>, t: T ) => Promise<ErrorsAnd<Acc>> ): Promise<ErrorsAnd<Acc>> {
  return ts.reduce ( ( accP, t ) => accP.then ( acc => mapErrorsK ( acc, acc => fn ( acc, t ) ) ), Promise.resolve ( zero ) )
}

export function composeErrorFn<From, Mid, To> ( fn1: ErrorFn<From, Mid>, fn2: ErrorFn<Mid, To> ): ErrorFn<From, To> {
  return ( value: From ) => mapErrors ( fn1 ( value ), fn2 )
}
export function composeErrorFnAndThen<From, Mid, To> ( fn1: ErrorFn<From, Mid>, fn2: ( mid: Mid ) => To ): ErrorFn<From, To> {
  return ( value: From ) => {
    const mid = fn1 ( value );
    if ( hasErrors ( mid ) ) return mid;
    return fn2 ( mid );
  }
}