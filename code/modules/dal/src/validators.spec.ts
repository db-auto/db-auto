import { validateTableName } from "./validator";
import { sampleMeta, sampleSummary } from "./dal.fixture";

describe ( "validators", () => {
  describe ( "tableNameValidator", () => {
    it ( "should accept tables that are valid", () => {
      expect ( validateTableName ( sampleSummary, sampleMeta ) ( "driver" ) ).toEqual ( [] )
      expect ( validateTableName ( sampleSummary, sampleMeta ) ( "driver", "drivertable" ) ).toEqual ( [] )
      expect ( validateTableName ( sampleSummary, sampleMeta ) ( "drivertable" ) ).toEqual ( [] )
      expect ( validateTableName ( sampleSummary, sampleMeta ) ( "mission" ) ).toEqual ( [] )
      expect ( validateTableName ( sampleSummary, sampleMeta ) ( "notin", "drivertable" ) ).toEqual ( [] )
    } )
    it ( "should reject table names that are not in summary or metadata", () => {
      expect ( validateTableName ( sampleSummary, sampleMeta ) ( "notin" ) ).toEqual ( [
        "Table notin is not known. Legal tables",
        "  driver_aud,drivertable,mission,mission_aud"
      ] )
      expect ( validateTableName ( sampleSummary, sampleMeta ) ( "driver", "notin" ) ).toEqual ( [
        "Table notin is not known. Legal tables",
        "  driver_aud,drivertable,mission,mission_aud"
      ] )
      expect ( validateTableName ( sampleSummary, sampleMeta ) ( "notin", "notin" ) ).toEqual ( [
        "Table notin is not known. Legal tables",
        "  driver_aud,drivertable,mission,mission_aud"
      ] )
    } )
  } )

} )