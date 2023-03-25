import { columnDataFor, ColumnDefn, toColumns } from "./columns";
import { NameAnd } from "./nameAnd";

interface ColumnTest {
  a: string,
  b: string,
  c: string
}
function makeCT ( i: number ): ColumnTest {
  return { a: `a${i}`, b: `b${i}`, c: `c${i}` }
}


const cd: NameAnd<ColumnDefn<ColumnTest>> = {
  "a": { title: 'ATitle', dataFn: ( t: ColumnTest ) => t.a },
  "b": { dataFn: ( t: ColumnTest ) => t.b },
  "c": { dataFn: ( t: ColumnTest ) => t.c }
}
describe ( "columns", () => {
  it ( "should make ColumnData with titles", () => {
    expect ( columnDataFor ( cd ) ( [ makeCT ( 1 ), makeCT ( 2 ) ] ) ).toEqual ( {
      lines: 3,
      "columns": [
        [
          "ATitle",
          "a1",
          "a2"
        ],
        [
          "b",
          "b1",
          "b2"
        ],
        [
          "c",
          "c1",
          "c2"
        ]
      ],
      "maxLengths": [
        6,
        2,
        2
      ]
    } );
  } )
  it ( "should make ColumnData without titles", () => {
    expect ( columnDataFor ( cd, false ) ( [ makeCT ( 1 ), makeCT ( 2 ) ] ) ).toEqual ( {
      lines: 2,
      "columns": [
        [
          "a1",
          "a2"
        ],
        [
          "b1",
          "b2"
        ],
        [
          "c1",
          "c2"
        ]
      ],
      "maxLengths": [
        2,
        2,
        2
      ]
    } );
  } )
} )

describe ( "toColumns", () => {
  it ( "should make a string[] each string being a line - no titles", () => {
    expect ( toColumns ( cd, false ) ( [ makeCT ( 1 ), makeCT ( 2 ) ] ) ).toEqual ( [
      "a1 b1 c1",
      "a2 b2 c2"
    ] )
  } )
  it ( "should make a string[] each string being a line - titles", () => {
    expect ( toColumns ( cd ) ( [ makeCT ( 1 ), makeCT ( 2 ) ] ) ).toEqual ( [
      "ATitle b  c",
      "a1     b1 c1",
      "a2     b2 c2"
    ] )
  } )
} )