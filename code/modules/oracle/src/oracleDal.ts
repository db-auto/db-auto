import { Dal, DalColMeta, DalDialect, DalMeta, DalQueryFn, DalRow, DalUpdateFn, DatabaseMetaData, NameAndType } from "@dbpath/dal";

import { OracleEnv } from "./oracleEnv";
import { Connection, Result } from "oracledb";
import { deepSort, flatMap, fromEntries, makeIntoNameAnd, makeIntoNameAndList, mapEntries, NameAnd, safeArray } from "@dbpath/utils";

const oracledb = require ( 'oracledb' );

const checkSql = ( sql: string, addSemiColon: boolean ) => addSemiColon && !sql.endsWith ( ';' ) ? sql + ';' : sql;
export const oracleDalQuery = ( connection: Connection ): DalQueryFn =>
  async ( sql, params ) => {
    let safeParams = safeArray ( params );
    let fulSql = checkSql ( sql, false );
    const result = await connection.execute ( fulSql, safeParams, { resultSet: true, outFormat: oracledb.OUT_FORMAT_OBJECT } );
    const rows: DalRow[] = [];
    const rs = result.resultSet;
    try {
      let row;
      while ( (row = await rs.getRow ()) ) {
        rows.push ( fromEntries<any> ( ...mapEntries<any, any> ( row, ( t, name ) => [ name.toLowerCase (), t ] ) ) )
      }
      const meta: DalMeta = { columns: result.metaData.map<DalColMeta> ( md => ({ name: md.name.toLowerCase () }) ) }
      return { rows, meta }
    } catch ( e ) {
      console.log ( e )
      throw e;
    } finally {
      await rs.close ();
    }
  };


const oracleDalUpdate = ( connection: Connection, addSemiColon?: boolean ): DalUpdateFn => {
  return async ( sql: string, ...params: any[] ): Promise<number> => {
    let fullSql = checkSql ( sql, addSemiColon );
    // console.log ( 'trying to execute', fullSql, params )
    try {
      const result: Result<unknown> = await connection.execute ( fullSql, safeArray ( params ) );
      // console.log ( sql, result.rowsAffected )
      return result.rowsAffected;
    } catch ( e ) {
      console.log ( e )
      throw e;
    }
  }
}
export const oracleSqlDialect: DalDialect = {
  limitFn: ( pageNum: number, pageSize: number, s: string[] ) => {
    const offset = (pageNum - 1) * pageSize
    return [ ...s, `LIMIT ${pageSize} OFFSET ${offset}` ]
  },
  safeQuery: 'SELECT 1'
}


async function findTableNames ( connection: Connection, schema: string ) {
  const tables = (await oracleDalQuery ( connection ) ( `  SELECT *
                                                           FROM all_tables
                                                           WHERE owner = :1`, [ schema ] )).rows.map ( t => t.table_name.toLowerCase () );
  return tables;
}
async function findPrimaryKeyData ( connection: Connection, schema: string ) {
  return (await oracleDalQuery ( connection ) (
    `select all_cons_columns.owner as schema_name,
            all_tab_columns.data_type,
            all_cons_columns.table_name,
            all_cons_columns.column_name,
            all_cons_columns.position,
            all_constraints.status
     from all_constraints,
          all_cons_columns,
          all_tab_columns
     where all_constraints.constraint_type = 'P'
       and all_constraints.constraint_name = all_cons_columns.constraint_name
       and all_constraints.owner = all_cons_columns.owner
       AND all_cons_columns.table_name NOT LIKE 'BIN%'
       AND all_cons_columns.owner = :schema
       AND all_tab_columns.owner = all_cons_columns.owner
       AND all_tab_columns.table_name = all_cons_columns.table_name
       AND all_tab_columns.column_name = all_cons_columns.column_name
    `, [ schema ] ))
    .rows.map ( r => ({ tablename: r.table_name.toLowerCase (), name: r.column_name.toLowerCase (), type: r.data_type.toLowerCase () }) );
}
async function findFKData ( connection: Connection, schema: string ) {
  let rows = (await oracleDalQuery ( connection ) ( `
      SELECT a.table_name  child_table,
             a.column_name child_column,
             a.constraint_name,
             b.table_name  parent_table,
             b.column_name parent_column
      FROM all_cons_columns a
               JOIN all_constraints c ON a.owner = c.owner AND a.constraint_name = c.constraint_name
               join all_cons_columns b on c.owner = b.owner and c.r_constraint_name = b.constraint_name
      WHERE c.constraint_type = 'R'
        AND a.owner = :schema`, [ schema ] )).rows;
  return flatMap ( rows, fk => {
    let refTable = fk.parent_table.toLowerCase ();
    let refColumn = fk.parent_column.toLowerCase ();
    let table = fk.child_table.toLowerCase ();
    let column = fk.child_column.toLowerCase ();
    let name = fk.constraint_name.toLowerCase ();
    let raw = `FOREIGN KEY (${column}) REFERENCES ${refTable}(${refColumn})`;
    return [ { refTable, refColumn, table, column, name, raw },
      { refTable: table, refColumn: column, table: refTable, column: refColumn, name, raw: raw + ' reversed' } ]
  } )
}

async function findColumns ( connection: Connection, schema: string ) {
  let rows = (await oracleDalQuery ( connection ) ( `
      SELECT table_name, column_name, data_type
      FROM all_tab_columns
      where all_tab_columns.table_name NOT LIKE 'BIN%'
        AND all_tab_columns.owner = :schema`, [ schema ] )).rows;
  const cleaned = rows.map ( r => ({ table: r.table_name.toLowerCase (), column: r.column_name.toLowerCase (), type: r.data_type.toLowerCase () }) );
  return makeIntoNameAndList ( cleaned, r => r.table, r => ({ name: r.column, type: r.type }) )
}
async function oracleMeta ( connection: Connection, schema: string ): Promise<DatabaseMetaData> {

  const tables = await findTableNames ( connection, schema );
  const pkRaw = await findPrimaryKeyData ( connection, schema )
  const pks: NameAnd<NameAndType> = makeIntoNameAnd ( pkRaw.filter ( pk => tables.includes ( pk.tablename ) ),
    r => r.tablename.toLowerCase (),
    r => ({ name: r.name.toLowerCase (), type: r.type.toLowerCase () }) )

  const fkRaw = await findFKData ( connection, schema )

  const columns = await findColumns ( connection, schema );
  // console.log ( 'tables', tables )
  // console.log ( 'pkRaw', pkRaw )
  // console.log ( 'fkRaw', fkRaw )
  // console.log ( 'pks', pks )
  const result = deepSort(makeIntoNameAnd ( tables, t => t,
    t => ({
      columns: makeIntoNameAnd ( columns[ t ], c => c.name, c => ({ ...c, name: undefined }) ),
      pk: safeArray ( pks[ t ] ),
      fk: makeIntoNameAnd ( fkRaw.filter ( f => f.table === t ), f => f.name, fk => ({ ...fk, name: undefined, table: undefined }) )
    }) ))


  return { tables: result as any }
}
export async function oracleDal ( env: OracleEnv ): Promise<Dal> {
  const connection = await oracledb.getConnection ( { user: env.username, password: env.password, connectionString: env.connection } );
  return {
    query: oracleDalQuery ( connection ),
    update: oracleDalUpdate ( connection, false ),
    close: () => connection.close (),
    metaData: () => oracleMeta ( connection, env.schema )
  }
}