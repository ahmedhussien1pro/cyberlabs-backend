export interface LabActionResult {
  success: boolean;
  exploited: boolean;
  message: string;
  data?: any[];
  evidence?: string;
  flag?: string;
  uiHint?: string;
}

export function buildLabResult(
  opts: { success: boolean } & Partial<Omit<LabActionResult, 'success'>>,
): LabActionResult {
  return { exploited: false, message: '', ...opts };
}

export function rowsContainValue(
  rows: any[],
  columns: string[],
  target: string,
): boolean {
  return rows.some((row) =>
    columns.some((col) => String(row[col] ?? '').includes(target)),
  );
}

export function rowsMatchColumn(
  rows: any[],
  column: string,
  value: string,
): boolean {
  return rows.some(
    (row) => String(row[column] ?? '').toLowerCase() === value.toLowerCase(),
  );
}
