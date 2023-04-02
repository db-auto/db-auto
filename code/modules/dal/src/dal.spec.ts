import { checkLimitOrThrow } from "./dal";

describe ( "checkLimitOrThrow", () => {
  it ( "should not throw if page number and page size are valid", () => {
    expect ( checkLimitOrThrow ( ( n, s, sql ) => [ `${n}`, `${s}`, ...sql ] ) ( 1, 2, [ "sql" ] ) ).toEqual (
      [ "1", "2", "sql" ]
    )
  } )
  it ( "should throw if page number is less then 1", () => {
    expect ( () => checkLimitOrThrow ( () => [] ) ( 0, 1, [] ) ).toThrowError (
      "Invalid page number (number) 0"
    );
  } )
  it ( "should throw if page number is not a number", () => {
    expect ( () => checkLimitOrThrow ( () => [] ) ( "pagenum" as any, 1, [] ) ).toThrowError (
      "Invalid page number (string) pagenum"
    );

  } )
  it ( "should throw if page number is less than 1", () => {
    expect ( () => checkLimitOrThrow ( () => [] ) ( -1, 1, [] ) ).toThrowError (
      "Invalid page number (number) -1"
    );
  } )
  it ( "should throw if page size is not a number", () => {
    expect ( () => checkLimitOrThrow ( () => [] ) ( 1, "pagesize" as any, [] ) ).toThrowError (
      "Invalid page size (string) pagesize"
    );
  } )
} )