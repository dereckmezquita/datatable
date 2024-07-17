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
        let indices = Array.from({ length: this._rowCount }, (_, i) => i);

        if (filterFn) {
            indices = indices.filter((i) => filterFn(this.getRow(i)));
        }

        let resultColumns: Partial<{ [K in keyof R]: R[K][] }> = {};

        if (operations?.select) {
            for (const key of operations.select) {
                resultColumns[key] = indices.map(
                    (i) => this._data[key as keyof T][i] as R[keyof R]
                );
            }
        } else {
            for (const key of this._columns) {
                resultColumns[key as keyof R] = indices.map(
                    (i) => this._data[key][i] as R[keyof R]
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
            const grouped = this.groupByColumnar(
                resultColumns as any,
                groupBy,
                indices
            );
            resultColumns = Object.fromEntries(
                Object.entries(resultColumns).map(([key, values]) => [
                    key,
                    grouped.map((g) => values[g[0]])
                ])
            ) as any;
        }

        return new DataTable(this.columnsToRows(resultColumns));
    }

    private getRow(index: number): T {
        const row = {} as T;
        for (const column of this._columns) {
            row[column] = this._data[column][index];
        }
        return row;
    }

    private groupByColumnar(
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
