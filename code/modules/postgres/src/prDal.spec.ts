import { postgresDal, PostgresEnv } from "./pgDal";

const inCi = process.env[ 'CI' ] === 'true'

const env: PostgresEnv = { type: 'postgres', host: 'localhost', port: 5432, 'database': 'postgres', username: 'phil', password: 'phil' };
const dal = postgresDal ( env );
describe ( 'pgDal', () => {
  it ( "should create tables, insert to the them and read from them", async () => {
    if ( inCi ) return
    try {
      await dal.update ( "drop table if exists drivertable" )
      await dal.update ( "drop table if exists mission" )
      await dal.update ( "drop table if exists driver_aud" )
      await dal.update ( "drop table if exists mission_aud" )

      await dal.update ( "create table if not exists drivertable (driverId int, name text)" )
      await dal.update ( "create table if not exists mission (id int, driverId int)" )
      await dal.update ( "create table if not exists driver_aud (id int,who text, what text)" )
      await dal.update ( "create table if not exists mission_aud (id int, who text, what text)" )

      await dal.update ( "insert into drivertable (driverId, name) values ($1, $2)", 1, "phil" )
      await dal.update ( "insert into drivertable (driverId, name) values ($1, $2)", 2, "joe" )
      await dal.update ( "insert into mission (id, driverId) values ($1, $2)", 1, 1 )
      await dal.update ( "insert into mission (id, driverId) values ($1, $2)", 2, 2 )
      await dal.update ( "insert into driver_aud (id, who, what) values ($1, $2, $3)", 1, "phil", "insert1" )
      await dal.update ( "insert into driver_aud (id, who, what) values ($1, $2, $3)", 2, "phil", "insert2" )
      await dal.update ( "insert into mission_aud (id, who, what) values ($1, $2, $3)", 1, "phil", "insert" )

      const res = await dal.query ( "select * from drivertable" )
      expect ( res.rows ).toEqual ( [
        {
          "driverid": 1,
          "name": "phil"
        },
        {
          "driverid": 2,
          "name": "joe"
        }
      ] );

    } finally {
      dal.close ();
    }
  } )

} )