import { mapEntries, NameAnd } from "./nameAnd";


export interface ColumnDefn<T> {
  title?: string, // overrides name
  dataFn: ( t: T ) => string
}

export function maxLength ( ss: string[] ): number {
  return ss.reduce ( ( a, b ) => a.length > b.length ? a : b ).length;
}

export interface ColumnData {
  lines: number,
  columns: string[][],
  maxLengths: number[]
}
export const columnDataFor = <T> ( defn: NameAnd<ColumnDefn<T>>, showTitles?: false ) => ( ts: T[] ): ColumnData => {
  const columnFor = ( d: ColumnDefn<T>, name: string ): string[] => {
    const title = showTitles !== false ? [ d.title || name ] : [];
    const strings = ts.map ( d.dataFn );
    return [ ...title, ...strings ];
  };
  const columns = mapEntries ( defn, columnFor );
  const maxLengths = columns.map ( maxLength );
  const lines = ts.length + (showTitles !== false ? 1 : 0);
  return { columns, maxLengths, lines }
};

export function columnDataToStrings ( cd: ColumnData ): string[] {
  const result: string[] = [];
  for ( let i = 0; i < cd.lines; i++ ) {
    const line = cd.columns.map ( ( cs, colIndex ) => cs[ i ].padEnd ( cd.maxLengths[ colIndex ] ) ).join ( ' ' )
    result.push ( line.trimRight () );
  }
  return result
}

export const toColumns = <T> ( defn: NameAnd<ColumnDefn<T>>, showTitles?: false ) => ( ts: T[] ) =>
  columnDataToStrings ( columnDataFor ( defn, showTitles ) ( ts ) );