import { NameAnd } from "@dbpath/utils";

export const oracleRowNum = 'dbautorownum';

export function hackDeleteRowForPaging ( r: NameAnd<any> ) {
  delete r[ oracleRowNum ]

}

export function hackFilterColumnNames ( c: { name: string } ) {
  return c.name !== oracleRowNum;
}

export function hackLimitFnForPaging ( pageNum: number, pageSize: number, sql: string[] ) {
  if ( sql.length === 0 ) return sql
  const start = 1 + (pageNum - 1) * pageSize
  const stop = (pageNum) * pageSize
  const hasWhere = sql.find ( s => s.includes ( ' where ' ) )
  function addLimit ( s: string ) {
    if ( hasWhere ) return s.replace ( 'where ', `where rownum <=${stop} and ` )
    return s.replace ( 'order by ', `where rownum<=${stop} order by ` )
  }
  const copy = [ sql[ 0 ].replace ( 'select ', `select /*+ FIRST_ROWS(${stop}) */ ` ), ...sql.slice ( 1 ) ]
    .map ( addLimit )

  return [ ...copy,
    `--${start}` ];
}