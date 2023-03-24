import { NameAnd } from "@db-auto/utils";

export interface Config {
  environment: NameAnd<Environment>,
  tables: NameAnd<Table>
}

export interface Table {
  table: string,
  primary?: Key,
  fk?: Key | Key[],
  views?: View | View[],
  links?: NameAnd<Link | Link[]>
}

export type LinkType = "one-to-many" | "many-to-one"
export type Link = HereAndThereLink | HereLinkAndThereLink
export interface HereAndThereLink {
  type: LinkType,
  idHereAndThere: string,
}
export interface HereLinkAndThereLink {
  type: LinkType,
  idHere: string,
  idThere: string,
}

export type View = string
export interface  Key {
  name: string,
  type: "integer" | "string"
}
export interface Environment {
  type: "oracle" | "mysql",
  url: string,
  username?: string,
  password?: string
}
