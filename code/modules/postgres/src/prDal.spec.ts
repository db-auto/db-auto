import { postgresDal, PostgresEnv } from "./pgDal";
import { DalResult, DatabaseMetaData, sampleMeta } from "@dbpath/dal";

const inCi = process.env[ 'CI' ] === 'true'

const env: PostgresEnv = { type: 'postgres', host: 'localhost', port: 5432, 'database': 'postgres', username: 'phil', password: 'phil' };
const dal = postgresDal ( env );
afterAll ( () => dal.close () )

describe ( 'pgDal', () => {
  it ( "should create tables, insert to the them and read from them", async () => {
    if ( inCi ) return
    await dal.update ( "drop table if exists drivertable cascade" )
    await dal.update ( "drop table if exists mission cascade" )
    await dal.update ( "drop table if exists driver_aud cascade" )
    await dal.update ( "drop table if exists mission_aud cascade" )

    await dal.update ( "create table if not exists drivertable (driverId int, name text)" )
    await dal.update ( "create table if not exists mission (id int, driverId int, mission text)" )
    await dal.update ( "create table if not exists driver_aud (id int,who text, what text)" )
    await dal.update ( "create table if not exists mission_aud (id int, who text, what text)" )
    await dal.update ( `alter table driverTable
        add constraint pk_driver primary key (driverId);` );
    await dal.update ( `alter table mission
        add constraint pk_mission primary key (id);` );
    await dal.update ( `ALTER TABLE mission
        ADD CONSTRAINT fk_mission_driver FOREIGN KEY (driverId) REFERENCES drivertable (driverId);` );
    await dal.update ( `alter table driver_aud drop constraint if exists fk_driver_aud_driver;` );
    await dal.update ( `ALTER TABLE driver_aud
        ADD CONSTRAINT fk_driver_aud_driver FOREIGN KEY (id) REFERENCES drivertable (driverId);` );
    await dal.update ( `alter table mission_aud
        add constraint fk_mission_aud_mission foreign key (id) references mission (id);` );


    await dal.update ( "insert into drivertable (driverId, name) values ($1, $2)", 1, "phil" )
    await dal.update ( "insert into drivertable (driverId, name) values ($1, $2)", 2, "joe" )
    await dal.update ( "insert into mission (id, driverId, mission) values ($1, $2, $3)", 1, 1, "m1" )
    await dal.update ( "insert into mission (id, driverId, mission) values ($1, $2, $3)", 2, 2, "m2" )
    await dal.update ( "insert into driver_aud (id, who, what) values ($1, $2, $3)", 1, "phil", "insert1" )
    await dal.update ( "insert into driver_aud (id, who, what) values ($1, $2, $3)", 2, "phil", "insert2" )
    await dal.update ( "insert into mission_aud (id, who, what) values ($1, $2, $3)", 1, "phil", "insert" )

    const res: DalResult = await dal.query ( "select * from drivertable" )
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
    expect ( res.meta ).toEqual ( {
      "columns": [
        { "name": "driverid" },
        { "name": "name" }
      ]
    } )

  } )

  it ( "should extract metadata", async () => {
    if ( inCi ) return
    const res: DatabaseMetaData = await dal.metaData ();
    expect ( res ).toEqual ( sampleMeta )
  } )

} )