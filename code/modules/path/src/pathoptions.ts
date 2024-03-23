import { safeArray } from "@dbpath/utils";


export interface JustPathOptions {
  showPlan: boolean
  showSql: boolean
  where: string[]
  fullSql: boolean,
  count: boolean
  distinct: boolean
}
export function justPathOptions ( options: any ): JustPathOptions {
  return {
    showPlan: options.plan,
    showSql: options.sql,
    fullSql: options.fullSql,
    where: safeArray ( options.where ),
    count: options.count,
    distinct: options.distinct,
  }
}