import { LinkInPath, TableInPath } from "@dbpath/types";

export const driverPath: TableInPath = {
  "fields": [],
  "table": "drivertable",
  "pk": [ "driverId" ],
}

export const driverMissionAuditPath: LinkInPath = {
  "fields": [],
  "idEquals": [],
  "previousLink": {
    "fields": [],
    "idEquals": [],
    "previousLink": {
      "fields": [],
      "idEquals": [],
      "pk": [ "driverId" ],
      "table": "drivertable"
    },
    "table": "mission",
    "pk": [ "id" ]
  },
  "table": "driver_aud",
  "pk": [ "id" ]
}
export const driverMissionAuditWithFieldsAndLinksPath: LinkInPath = {
  "previousLink": {
    "previousLink": {
      "fields": [],
      "table": "drivertable",
      pk: [ "driverId" ]
    },
    "table": "mission",
    "pk": [ "id" ],
    "fields": [],
    "idEquals": [ { "fromId": "id1", "toId": "id2" } ],
  },
  "table": "audit",
  "pk": [ "id" ],
  "fields": [ "f3", "f4" ],
  "idEquals": [ { "fromId": "id2", "toId": "id3" } ],
}

export const crossSchemaPath: LinkInPath = {
  "fields": [],
  "idEquals": [],
  "pk": [
    "id"
  ],
  "previousLink": {
    "fields": [],
    "idEquals": [
      {
        "fromId": "driverId",
        "toId": "id"
      }
    ],
    "pk": [
      "id"
    ],
    "previousLink": {
      "fields": [],
      "pk": [
        "driverId"
      ],
      "schema": " s0",
      "table": "drivertable"
    },
    "schema": "s1",
    "table": "mission"
  },
  "schema": "s2",
  "table": "driver_aud"

}