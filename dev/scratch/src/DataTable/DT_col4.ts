export class DataTable<T extends Record<string, any>> {
    private _data: { [K in keyof T]: T[K][] };
    private _columns: (keyof T)[];
    private _rowCount: number;
    private _keys: Set<keyof T>;

    constructor(data: T[] | { [K in keyof T]: T[K][] }) {
        this._data = {} as { [K in keyof T]: T[K][] };
        this._columns = [];
        this._rowCount = 0;
        this._keys = new Set();

        if (Array.isArray(data)) {
            this.initialiseFromRows(data);
        } else {
            this.initialiseFromColumns(data);
        }
    }

    private initialiseFromRows(data: T[]): void {
        this._columns = Object.keys(data[0]) as (keyof T)[];
        this._rowCount = data.length;

        for (const column of this._columns) {
            this._data[column] = data.map((row) => row[column]);
        }
    }

    private initialiseFromColumns(data: { [K in keyof T]: T[K][] }): void {
        this._data = data;
        this._columns = Object.keys(data) as (keyof T)[];
        this._rowCount = data[this._columns[0]].length;
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

    public setRow(row: T): void {
        for (const column of this._columns) {
            this._data[column].push(row[column]);
        }
        this._rowCount++;
    }

    public setRows(rows: T[]): void {
        for (const row of rows) {
            this.setRow(row);
        }
    }

    public toString(): string {
        return JSON.stringify(this.getRows());
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

    public query<R extends Record<string, any> = {}>(
        filterFn?: (row: T & Partial<R>) => boolean,
        operations?: {
            select?: (keyof (T & R))[];
            assign?: {
                [P in keyof R]?: (row: T & Partial<R>, index: number) => R[P];
            };
        },
        options?: {
            by?: keyof (T & R) | (keyof (T & R))[];
            SD?: (keyof (T & R))[];
        }
    ): DataTable<T & R> {
        let indices: number[] = Array.from(
            { length: this._rowCount },
            (_, i) => i
        );

        if (filterFn) {
            indices = indices.filter((i) =>
                filterFn(this.getRow(i) as T & Partial<R>)
            );
        }

        // Handle assign operation (in-place modification)
        if (operations?.assign) {
            for (const [key, fn] of Object.entries(operations.assign)) {
                if (fn) {
                    const newColumn = indices.map((i) =>
                        fn(this.getRow(i) as T & Partial<R>, i)
                    );
                    (this._data as any)[key] = newColumn;
                    if (!this._columns.includes(key as keyof T)) {
                        (this._columns as any).push(key);
                    }
                }
            }
        }

        // Handle select operation
        if (operations?.select) {
            const selectedData: Partial<{
                [K in keyof (T & R)]: (T & R)[K][];
            }> = {};
            for (const key of operations.select) {
                selectedData[key] = indices.map(
                    (i) => (this._data as any)[key][i]
                );
            }
            return new DataTable(
                selectedData as { [K in keyof (T & R)]: (T & R)[K][] }
            );
        }

        // Handle grouping
        if (options?.by) {
            const groupBy = Array.isArray(options.by)
                ? options.by
                : [options.by];
            const grouped = this.groupBy(
                this._data as { [K in keyof (T & R)]: (T & R)[K][] },
                groupBy as (keyof (T & R))[],
                indices
            );
            const resultColumns: { [K in keyof (T & R)]: (T & R)[K][] } =
                {} as {
                    [K in keyof (T & R)]: (T & R)[K][];
                };
            for (const key of this._columns) {
                resultColumns[key as keyof (T & R)] = grouped.map(
                    (g) => (this._data as any)[key][g[0]]
                );
            }
            return new DataTable<T & R>(resultColumns);
        }

        // If no select or grouping, return this (possibly modified) instance
        return this as unknown as DataTable<T & R>;
    }

    private groupBy<K extends keyof T>(
        columns: { [K in keyof T]: T[K][] },
        keys: K[],
        indices: number[]
    ): number[][] {
        const groups: { [key: string]: number[] } = {};
        for (let i = 0; i < indices.length; i++) {
            const key = keys.map((k) => columns[k][indices[i]]).join('|');
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(indices[i]);
        }
        return Object.values(groups);
    }
}
