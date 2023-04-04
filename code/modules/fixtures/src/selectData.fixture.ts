export const selectDataForDriver = {
  schema: 's0',
  "table": "someSchema.drivertable",
  "alias": "T0",
  pk: [ 'driverId' ],
  "columns": [ "*" ],
  "where": [ "T0.driverid=1" ],
}

export const selectDataForDriverMissionAuditAndWhere = [
  { schema: 's0', "alias": "T0", "columns": [ '*' ], "table": "someSchema.drivertable", pk: [ 'driverId' ], "where": [ "T0.driverid=1" ] },
  { schema: 's1', "alias": "T1", "columns": [ '*' ], "table": "someSchema.mission", pk: [ 'id' ], "where": [ "T0.id1 = T1.id2" ] },
  { schema: 's2', "alias": "T2", "columns": [ "f3", "f4" ], "table": "someSchema.audit", pk: [ 'id' ], "where": [ "T1.id2 = T2.id3" ] }
]
