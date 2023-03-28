import { Pool } from "pg";
import { ColumnMetaData, ForeignKeyMetaData, MetaDataFn, TableMetaData } from "@dbpath/dal";
import { addNameAnd2, deepSortNames, fromEntries, NameAnd } from "@dbpath/utils";


export const pgMeta = ( p: Pool, schema: string ): MetaDataFn => async (): Promise<any> => {
  const client = await p.connect ();
  try {
    const tables = await client.query ( `    SELECT table_name
                                             FROM information_schema.tables
                                             WHERE table_schema = $1
                                             order by table_name`, [ schema ] );

    const tableNames = tables.rows.map ( r => r.table_name );
    const columns = await client.query ( `SELECT table_name, column_name, data_type
                                          FROM information_schema.columns
                                          where table_schema = $1
                                          order by table_name, column_name`, [ schema ] );
    const table2Columns: NameAnd<NameAnd<ColumnMetaData>> = {};
    columns.rows.forEach ( r => {
      addNameAnd2 ( table2Columns ) ( r.table_name, r.column_name, { type: r.data_type.toString () } );
    } )

    const fks = await client.query ( `select r.oid,
                                             c.relname                                    as tablename,
                                             u.table_name                                 as reftable,
                                             conname                                      as fkname,
                                             pg_catalog.pg_get_constraintdef(r.oid, true) as raw
                                      FROM pg_catalog.pg_constraint r,
                                           information_schema.constraint_column_usage u,
                                           pg_class c
                                      WHERE r.contype = 'f'
                                        and r.conname = u.constraint_name
                                        and c.oid = r.conrelid
                                      order by c.relname, conname` );
    const table2Fks: NameAnd<NameAnd<ForeignKeyMetaData>> = {};
    function row2Fk ( r: any ): ForeignKeyMetaData {
      let raw = r.raw;
      const m = raw.match ( /FOREIGN KEY \((.*)\) REFERENCES (.*)\((.*)\)/ );
      if ( m ) {
        return { column: m[ 1 ], refTable: m[ 2 ], refColumn: m[ 3 ], raw };
      }
      throw new Error ( `Cannot parse foreign key ${raw}` );
    }
    function reverseFk ( tableName: string, fk: ForeignKeyMetaData ): ForeignKeyMetaData {
      return { column: fk.refColumn, refTable: tableName, refColumn: fk.column, raw: fk.raw + ' reversed' };
    }
    fks.rows.forEach ( r => {
        let fk = row2Fk ( r );
        addNameAnd2 ( table2Fks ) ( r.tablename, r.fkname, fk );
        addNameAnd2 ( table2Fks ) ( fk.refTable, r.fkname, reverseFk ( r.tablename, fk ) );
      }
    )

    let tableNamesAndMetaData: [ string, TableMetaData ][] = tableNames.map ( t => {
      let tableMetadata: TableMetaData = { columns: table2Columns[ t ], fk: table2Fks[ t ] };
      return [ t.toString (), tableMetadata ]
    } );
    return { tables: deepSortNames ( fromEntries ( ...tableNamesAndMetaData ) ) };
  } finally {
    client.release ();
  }
}