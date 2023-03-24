import { flatMapEntries, NameAnd } from "./nameAnd";
import { flatMap } from "./utils";

export type Validator<T> = ( value: T ) => string[]
export type NameAndValidator<T> = ( name: string ) => ( value: T ) => string[]

export function validateIsType ( expected: string, allowUndefined?: true ): NameAndValidator<any> {
  return ( name ) => ( value ) => {
    if ( value === undefined ) return allowUndefined ? [] : [ `${name} is undefined. It should be a ${expected}` ];
    return typeof value === expected ? [] : [ `${name} is [${JSON.stringify ( value )}] which is a ${typeof value} and not a ${expected}` ];
  }
}
export const validateString: NameAndValidator<string> = validateIsType ( 'string' );
export const validateNumber: NameAndValidator<number> = validateIsType ( 'number' )

export function validateValue<T> ( ...values: T[] ): NameAndValidator<T> {
  return ( name ) => ( value: T ) => values.includes ( value ) ? [] : [ `${name} is [${JSON.stringify ( value )}] not one of ${JSON.stringify ( values )}` ];
}

export function composeValidators<T> ( ...fns: Validator<T>[] ): Validator<T> {
  return ( value: T ) => flatMap ( fns, v => v ( value ) );
}
export function composeNameAndValidators<T> ( ...fns: NameAndValidator<T>[] ): NameAndValidator<T> {
  return ( name: string ) => ( value: T ) => flatMap ( fns, v => v ( name ) ( value ) );
}
export function orValidators<T> ( msg: string, ...fns: NameAndValidator<T>[] ): NameAndValidator<T> {
  return ( name: string ) => ( value: T ) => {
    for ( const fn of fns ) {
      const errors = fn ( name ) ( value );
      if ( errors.length === 0 ) return [];
    }
    return [ `${name} ${msg}` ];
  };
}
export function validateItemOrArray<Main, K extends keyof Main> ( key: K, validator: NameAndValidator<Main[K]> ): NameAndValidator<Main> {
  return ( name ) => ( value: Main ) => {
    const v = value[ key ];
    if ( v === undefined ) return [];
    let i = 0;
    if ( Array.isArray ( v ) ) return flatMap ( v, validator ( `${name}[${i++}]` ) );
    return validator ( name ) ( v );
  };
}
export function validateChild<Main, K extends keyof Main> ( key: K, validator: NameAndValidator<Main[K]> ): NameAndValidator<Main> {
  return ( name ) => ( value: Main ) => validator ( name + '.' + key.toString () ) ( value[ key ] );
}
export function validateNameAnd<Main extends NameAnd<T>, T> ( validator: NameAndValidator<T> ): NameAndValidator<NameAnd<T>> {
  return name => ( value: Main ) => value === undefined ? [] : flatMapEntries ( value, ( t, n ) => validator ( name + '.' + n ) ( t ) );
}
export const validateChildString = <Main, K extends keyof Main> ( key: K ) => validateChild<Main, K> ( key, validateString as any )
export const validateChildValue = <Main, K extends keyof Main> ( key: K, ...legalValues: Main[K][] ): NameAndValidator<Main> =>
  validateChild<Main, K> ( key, validateValue ( ...legalValues ) as any )
export const validateChildNumber = <Main, K extends keyof Main> ( key: K ): NameAndValidator<Main> => validateChild<Main, K> ( key, validateNumber as any )
export const validateChildStringOrUndefined = <Main, K extends keyof Main> ( key: K ): NameAndValidator<Main> =>
  validateChild ( key, validateIsType ( 'string', true ) as any )
export const validateChildNumberOrUndefined = <Main, K extends keyof Main> ( key: K ): NameAndValidator<Main> =>
  validateChild ( key, validateIsType ( 'number', true ) as any )

export const validate = <Main, Res> ( name: string, validator: NameAndValidator<Main>, value: any, ifTrue: ( value: Main ) => Res, ifErrors: ( errors: string[] ) => Res ): Res => {
  const errorsOrValue = validator ( name ) ( value );
  return errorsOrValue.length > 0 ? ifErrors ( errorsOrValue ) : ifTrue ( value );
};