export interface LabActionResult {
  success: boolean;
  exploited: boolean;
  message: string;
  data?: any[];
  evidence?: string;
  flag?: string;
  uiHint?: string;
}

/** Builds a consistent lab action response */
export function buildLabResult(
  opts: { success: boolean } & Partial<Omit<LabActionResult, 'success'>>,
): LabActionResult {
  return { exploited: false, message: '', ...opts };
}

/** Returns true if any row contains a target string in any of the given columns */
export function rowsContainValue(
  rows: any[],
  columns: string[],
  target: string,
): boolean {
  return rows.some((row) =>
    columns.some((col) => String(row[col] ?? '').includes(target)),
  );
}

/** Returns true if any row's column matches value exactly (case-insensitive) */
export function rowsMatchColumn(
  rows: any[],
  column: string,
  value: string,
): boolean {
  return rows.some(
    (row) => String(row[column] ?? '').toLowerCase() === value.toLowerCase(),
  );
}
