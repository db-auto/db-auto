import { LinkInPath, TableInPath } from "@dbpath/types";

export const driverPath: TableInPath = {
  "fields": [],
  "table": "drivertable"
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
      "table": "drivertable"
    },
    "table": "mission"
  },
  "table": "driver_aud"
}
export const driverMissionAuditWithFieldsAndLinksPath: LinkInPath = {
  "fields": [ "f3", "f4" ],
  "idEquals": [ { "fromId": "id2", "toId": "id3" }
  ],
  "previousLink": {
    "fields": [],
    "idEquals": [ { "fromId": "id1", "toId": "id2" } ],
    "previousLink": {
      "fields": [],
      "table": "drivertable"
    },
    "table": "mission"
  },
  "table": "audit"
}