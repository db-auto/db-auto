import { mergeSelectData } from "./selectData";

import { selectDataForDriver, selectDataForDriverMissionAuditAndWhere } from "@dbpath/fixtures";


describe ( "merge", () => {
  it ( "should mergeSelectData just one step", () => {
    expect ( mergeSelectData ( [ selectDataForDriver ] ) ).toEqual ( {
      "columns": [ { "alias": "T0", "column": "*" } ],
      "tables": [ { "alias": "T0", "table": "someSchema.drivertable" } ],
      "where": [ "T0.driverid=1" ]
    } )
  } )
  it ( "should mergeSelectData for more complex", () => {
    expect ( mergeSelectData ( selectDataForDriverMissionAuditAndWhere ) ).toEqual ( {
      "columns": [ { "alias": "T0", "column": "*" }, { "alias": "T1", "column": "*" }, { "alias": "T2", "column": "f3" }, { "alias": "T2", "column": "f4" } ],
      "tables": [ { "alias": "T0", "table": "someSchema.drivertable" }, { "alias": "T1", "table": "someSchema.mission" }, { "alias": "T2", "table": "someSchema.audit" } ],
      "where": [ "T0.driverid=1", "T0.id1 = T1.id2", "T1.id2 = T2.id3" ]
    } )
  } )
} )
