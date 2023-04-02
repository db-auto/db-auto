export const selectDataForDriver = {
  "alias": "T0",
  "columns": [ "*" ],
  "table": "someSchema.drivertable",
  "where": [ "T0.driverid=1" ],
  pk: [ 'driverId' ]
}

export const selectDataForDriverMissionAuditAndWhere = [
  { "alias": "T0", "columns": [ '*' ], "table": "someSchema.drivertable", pk: [ 'driverId' ], "where": [ "T0.driverid=1" ] },
  { "alias": "T1", "columns": [ '*' ], "table": "someSchema.mission", pk: [ 'id' ], "where": [ "T0.id1 = T1.id2" ] },
  { "alias": "T2", "columns": [ "f3", "f4" ], "table": "someSchema.audit", pk: [ 'id' ], "where": [ "T1.id2 = T2.id3" ] }
]
