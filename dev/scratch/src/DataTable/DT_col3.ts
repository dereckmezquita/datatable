export class DataTable<T extends Record<string, any>> {
    private _data: { [K in keyof T]: T[K][] };
    private _columns: (keyof T)[];
    private _rowCount: number;
    private _keys: Set<keyof T>;

    constructor(data: T[]) {
        this._data = {} as { [K in keyof T]: T[K][] };
        this._columns = Object.keys(data[0]) as (keyof T)[];
        this._rowCount = data.length;
        this._keys = new Set();
        this.initialiseFromData(data);
    }

    private initialiseFromData(data: T[]): void {
        for (const column of this._columns) {
            this._data[column] = data.map((row) => row[column]);
        }
    }

    public setkey(key: keyof T | (keyof T)[]): void {
        this._keys = new Set(Array.isArray(key) ? key : [key]);
    }

    public setorder(columns: (keyof T)[]): void {
        const sortedIndices = Array.from(
            { length: this._rowCount },
            (_, i) => i
        ).sort((a, b) => {
            for (const col of columns) {
                if (this._data[col][a] < this._data[col][b]) return -1;
                if (this._data[col][a] > this._data[col][b]) return 1;
            }
            return 0;
        });

        for (const col of this._columns) {
            this._data[col] = sortedIndices.map((i) => this._data[col][i]);
        }
    }

    public addRow(row: T): void {
        for (const column of this._columns) {
            this._data[column].push(row[column]);
        }
        this._rowCount++;
    }

    public addRows(rows: T[]): void {
        for (const row of rows) {
            this.addRow(row);
        }
    }

    public toString(): string {
        return JSON.stringify(this.getRows(), null, 2);
    }

    private getRows(): T[] {
        return Array.from({ length: this._rowCount }, (_, i) => {
            const row = {} as T;
            for (const column of this._columns) {
                row[column] = this._data[column][i];
            }
            return row;
        });
    }

    private getRow(index: number): T {
        const row = {} as T;
        for (const column of this._columns) {
            row[column] = this._data[column][index];
        }
        return row;
    }

    // --------
    public query<R extends Partial<T>>(
        filterFn?: (row: T) => boolean,
        operations?: {
            select?: (keyof R)[];
            assign?: { [P in keyof R]?: (row: T, index: number) => R[P] };
        },
        options?: {
            by?: keyof T | (keyof T)[];
            SD?: (keyof T)[];
        }
    ): DataTable<R> {
        let indices: number[] = Array.from(
            { length: this._rowCount },
            (_, i) => i
        );

        if (filterFn) {
            indices = indices.filter((i) => filterFn(this.getRow(i)));
        }

        let resultColumns: Partial<{ [K in keyof R]: R[K][] }> = {};

        if (operations?.select) {
            for (const key of operations.select) {
                resultColumns[key] = indices.map(
                    (i) =>
                        this._data[key as keyof T][i] as unknown as R[keyof R]
                );
            }
        } else {
            for (const key of this._columns) {
                resultColumns[key as keyof R] = indices.map(
                    (i) => this._data[key][i] as unknown as R[keyof R]
                );
            }
        }

        if (operations?.assign) {
            for (const [key, fn] of Object.entries(operations.assign)) {
                if (fn) {
                    resultColumns[key as keyof R] = indices.map((i) =>
                        fn(this.getRow(i), i)
                    );
                }
            }
        }

        if (options?.by) {
            const groupBy = Array.isArray(options.by)
                ? options.by
                : [options.by];
            const grouped = this.groupBy(
                resultColumns as unknown as { [K in keyof T]: T[K][] },
                groupBy as (keyof T)[],
                indices
            );
            resultColumns = Object.fromEntries(
                Object.entries(resultColumns).map(([key, values]) => [
                    key,
                    grouped.map((g) => (values as any[])[g[0]])
                ])
            ) as Partial<{ [K in keyof R]: R[K][] }>;
        }

        return new DataTable(
            this.columnsToRows(resultColumns as { [K in keyof R]: R[K][] })
        );
    }

    private groupBy(
        columns: { [K in keyof T]: T[K][] },
        keys: (keyof T)[],
        indices: number[]
    ): number[][] {
        const groups: { [key: string]: number[] } = {};
        for (let i = 0; i < indices.length; i++) {
            const key = keys.map((k) => columns[k][i]).join('|');
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(i);
        }
        return Object.values(groups);
    }

    private columnsToRows<R>(columns: { [K in keyof R]: R[K][] }): R[] {
        const keys = Object.keys(columns) as (keyof R)[];
        const rowCount = columns[keys[0]].length;
        return Array.from({ length: rowCount }, (_, i) => {
            const row = {} as R;
            for (const key of keys) {
                row[key] = columns[key][i];
            }
            return row;
        });
    }
}
