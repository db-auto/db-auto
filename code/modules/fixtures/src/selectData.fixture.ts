export const selectDataForDriver = {
  "alias": "T0",
  "columns": [ "*" ],
  "table": "schema.drivertable",
  "where": [ "T0.driverid=1" ]
}

export const selectDataForDriverMissionAuditAndWhere = [
  { "alias": "T0", "columns": [ '*' ], "table": "schema.drivertable", "where": [ "T0.driverid=1" ] },
  { "alias": "T1", "columns": [ '*' ], "table": "schema.mission", "where": [ "T0.id1 = T1.id2" ] },
  { "alias": "T2", "columns": [ "f3", "f4" ], "table": "schema.audit", "where": [ "T1.id2 = T2.id3" ] }
]
