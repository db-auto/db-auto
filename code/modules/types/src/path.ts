import { TwoIds } from "@dbpath/dal";


export interface TableInPath {
  table: string
  fullTable?: string
  fields?: string[ ]
}
export interface LinkInPath extends TableInPath {
  previousLink: PathItem
  idEquals: TwoIds[]
}

export type PathItem = LinkInPath | TableInPath;

export function isLinkInPath ( p: PathItem ): p is LinkInPath {
  return (p as LinkInPath).previousLink !== undefined
}
export function isTableInPath ( p: PathItem ): p is TableInPath {
  return !isLinkInPath ( p )
}
