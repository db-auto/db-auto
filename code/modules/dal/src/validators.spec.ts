import { validateFields, validateLinks, validateTableName } from "./validator";
import { sampleMeta, sampleSummary } from "@dbpath/fixtures";


describe ( "validators", () => {
  describe ( "tableNameValidator", () => {
    it ( "should accept tables that are valid", () => {
      expect ( validateTableName ( sampleSummary, sampleMeta ) ( "driver" ) ).toEqual ( [] )
      expect ( validateTableName ( sampleSummary, sampleMeta ) ( "drivertable" ) ).toEqual ( [] )
      expect ( validateTableName ( sampleSummary, sampleMeta ) ( "mission" ) ).toEqual ( [] )
    } )
    it ( "should reject table names that are not in summary or metadata", () => {
      expect ( validateTableName ( sampleSummary, sampleMeta ) ( "notin" ) ).toEqual ( [
        "Table notin is not known. Legal tables",
        "  driver_aud,drivertable,mission,mission_aud"
      ] )
    } )
  } )

  describe ( "fieldValidator", () => {
    it ( "should accept fields that are valid", () => {
      expect ( validateFields ( sampleSummary, sampleMeta ) ( "driver", [ "driverid", "name" ] ) ).toEqual ( [] )
      expect ( validateFields ( sampleSummary, sampleMeta ) ( "drivertable", [ "driverid", "name" ] ) ).toEqual ( [] )
    } )
    it ( "should reject fields that are invalid", () => {
      expect ( validateFields ( sampleSummary, sampleMeta ) ( "driver", [ "driverid", "name", "notIn" ] ) ).toEqual ( [
        "Fields notIn are not known for table driver. Legal fields",
        "  driverid,name"
      ] )
    } )
  } )

  describe ( "linkValidator", () => {
    it ( "should accept links that are valid", () => {
      expect ( validateLinks ( sampleSummary, sampleMeta ) ( "driver", "mission", [ { fromId: 'driverid', toId: 'driverid' } ] ) ).toEqual ( [] )
      expect ( validateLinks ( sampleSummary, sampleMeta ) ( "driver", "mission", [ { fromId: 'driverid', toId: 'id' }, { fromId: 'driverid', toId: 'driverid' } ] ) ).toEqual ( [] )
    } )
  } )

  describe ( "following fk links validator", () => {
    it ( "should accept links that follow a fk", () => {
      expect ( validateLinks ( sampleSummary, sampleMeta ) ( "driver", "mission", [] ) ).toEqual ( [] )
      expect ( validateLinks ( sampleSummary, sampleMeta ) ( "driver", "driver_aud", [] ) ).toEqual ( [] )
    } )
    it ( "should reject links that do not follow a fk driver to driver", () => {
      expect ( validateLinks ( sampleSummary, sampleMeta ) ( "driver", "driver", [] ) ).toEqual ( [
        "No foreign key from driver to driver. Valid links are ",
        "  driver.(driverid,id)driver_aud",
        "  driver.(driverid,driverid)mission"
      ] )
    } )
    it ( "should reject links that do not follow a fk driver to mission_aud", () => {
      expect ( validateLinks ( sampleSummary, sampleMeta ) ( "driver", "mission_aud", [] ) ).toEqual ( [
        "No foreign key from driver to mission_aud. Valid links are ",
        "  driver.(driverid,id)driver_aud",
        "  driver.(driverid,driverid)mission"
      ] )
    } )
  } )
} )