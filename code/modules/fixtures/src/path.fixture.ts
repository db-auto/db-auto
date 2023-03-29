import { LinkInPath, TableInPath } from "@dbpath/types";

const driverPath: TableInPath = {
  "fields": [],
  "fullTable": "full",
  "table": "driver"
}

const driverMissionAuditPath: LinkInPath = {
  "fields": [],
  "idEquals": [],
  "previousLink": {
    "fields": [],
    "idEquals": [],
    "previousLink": {
      "fields": [],
      "idEquals": [],
      "table": "drive"
    },
    "table": "mission"
  },
  "table": "audit"
}
const driverMissionAuditWithFieldsAndLinksPath: LinkInPath = {
  "fields": [ "f3", "f4" ],
  "idEquals": [ { "fromId": "id2", "toId": "id3" }
  ],
  "previousLink": {
    "fields": [],
    "idEquals": [ { "fromId": "id1", "toId": "id2" } ],
    "previousLink": {
      "fields": [],
      "fullTable": "full",
      "table": "driver"
    },
    "table": "mission"
  },
  "table": "audit"
}