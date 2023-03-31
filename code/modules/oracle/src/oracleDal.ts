import { Dal, DalColMeta, DalMeta, DalQueryFn, DalRow, DalUpdateFn } from "@dbpath/dal";

import { OracleEnv } from "./oracleEnv";
import { Connection, Result } from "oracledb";
import { fromEntries, mapEntries, mapObjectKeys } from "@dbpath/utils";

const oracledb = require ( 'oracledb' );

const checkSql = ( sql: string, addSemiColon: boolean ) => addSemiColon && !sql.endsWith ( ';' ) ? sql + ';' : sql;
export const oracleDalQuery = ( connection: Connection ): DalQueryFn =>
  async ( sql, params ) => {
    const result = await connection.execute ( checkSql ( sql, false ),
      [],
      { resultSet: true, outFormat: oracledb.OUT_FORMAT_OBJECT } );
    const rows: DalRow[] = [];
    const rs = result.resultSet;
    try {
      let row;
      while ( (row = await rs.getRow ()) ) {
        rows.push ( fromEntries<any> ( ...mapEntries<any, any> ( row, ( t, name ) => [ name.toLowerCase (), t ] ) ) )
      }
    } finally {
      await rs.close ();
      const meta: DalMeta = { columns: result.metaData.map<DalColMeta> ( md => ({ name: md.name.toLowerCase () }) ) }
      return { rows, meta }
    }
  };


const oracleDalUpdate = ( connection: Connection, addSemiColon?: boolean ): DalUpdateFn => {
  return async ( sql: string, ...params: any[] ): Promise<number> => {
    let fullSql = checkSql ( sql, addSemiColon );
    console.log ( 'trying to execute', fullSql, params )
    try {
      const result: Result<unknown> = await connection.execute ( fullSql, params );
      console.log ( sql, result.rowsAffected )
      return result.rowsAffected;
    } catch ( e ) {
      console.log ( e )
      throw e;
    }
  }
}


function oracleMeta ( connection: Connection, schema: string ) {
  return function () {return undefined;};
}
export async function oracleDal ( env: OracleEnv ): Promise<Dal> {
  const connection = await oracledb.getConnection ( { user: "phil", password: "phil", connectionString: "localhost/xepdb1" } );
  // let sql = `ALTER SESSION SET CURRENT_SCHEMA=${env.schema}`;
  // console.log ( 1, sql )
  // await oracleDalUpdate ( connection ) ( sql )
  // console.log ( 2 )
  return {
    query: oracleDalQuery ( connection ),
    update: oracleDalUpdate ( connection, false ),
    close: () => connection.close (),
    metaData: oracleMeta ( connection, env.schema )
  }
}