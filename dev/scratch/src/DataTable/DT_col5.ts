export type ColumnarData = Record<string, any[]>;

export class DataTable {
    private _data: Map<string, any>[];
    private _columns: string[] = [];
    private _rowCount: number = 0;
    private _keys: string[] = [];

    constructor(input: Map<string, any>[]) {
        if (input.length === 0) {
            throw new Error('Input data must not be empty');
        }

        this._data = input;
        this._columns = [...input[0].keys()];
        this._rowCount = input.length;
    }

    private checkColumnsExist(cols: string[]): void {
        const missingCols = cols.filter((col) => !this._columns.includes(col));
        if (missingCols.length > 0) {
            throw new Error(`Columns do not exist: ${missingCols.join(', ')}`);
        }
    }

    setorder(cols: string[]): void {
        this.checkColumnsExist(cols);

        // Create a new order for all columns
        const remainingColumns: string[] = this._columns.filter(
            (col) => !newOrder.includes(col)
        );
        const newOrder = [...cols, ...remainingColumns];

        // Reorder properties in each row
        this._data = this._data.map((row) => {
            const newRow = new Map<string, any>();
            for (const col of newOrder) {
                if (row.has(col)) {
                    newRow.set(col, row.get(col));
                }
            }
            return newRow;
        });

        this._columns = newOrder;
    }

    addRow(row: ColumnarData): void {}

    addRows(rows: ColumnarData[]): void {}

    setkey(keys: string | string[]): void {}

    getRow(index: number): ColumnarData {}

    getRows(start: number, end: number): T[] {
        if (start < 0 || end > this.rowCount || start >= end) {
            throw new Error('Invalid range');
        }
        return Array.from({ length: end - start }, (_, i) =>
            this.getRow(start + i)
        );
    }

    toRows(): T[] {
        return this.getRows(0, this.rowCount);
    }

    query(
        i?: (row: T, index: number) => boolean,
        j?: {
            select?: string[];
            assign?: Record<string, (row: T, index: number) => any>;
        },
        by?: string | string[]
    ): DataTable {
        let result: T[] = this.toRows();

        // Apply i (filter)
        if (i) {
            result = result.filter((row, index) => i(row, index));
        }

        // Apply by (grouping)
        if (by) {
            const byColumns = Array.isArray(by) ? by : [by];
            this.checkColumnsExist(byColumns);
            const groups = new Map<string, T[]>();
            for (const row of result) {
                const key = byColumns.map((col) => row[col]).join('|');
                if (!groups.has(key)) {
                    groups.set(key, []);
                }
                groups.get(key)!.push(row);
            }

            if (j && j.assign) {
                const newResult: any[] = [];
                for (const [key, group] of groups) {
                    const newRow: any = {};
                    for (const col of byColumns) {
                        newRow[col] = group[0][col];
                    }
                    for (const [newCol, fn] of Object.entries(j.assign)) {
                        newRow[newCol] = fn(group as any, 0);
                    }
                    newResult.push(newRow);
                }
                return new DataTable(newResult);
            }

            return new DataTable(Array.from(groups.values()).flat());
        }

        // Apply j (select and assign)
        if (j) {
            if (j.select) {
                this.checkColumnsExist(j.select);
                result = result.map((row) => {
                    const newRow: any = {};
                    for (const col of j.select!) {
                        newRow[col] = row[col];
                    }
                    return newRow as T;
                });
            }

            if (j.assign) {
                for (const [newCol, fn] of Object.entries(j.assign)) {
                    for (let i = 0; i < result.length; i++) {
                        result[i] = {
                            ...result[i],
                            [newCol]: fn(result[i], i)
                        };
                    }
                }
            }
        }

        return new DataTable(result);
    }
}
