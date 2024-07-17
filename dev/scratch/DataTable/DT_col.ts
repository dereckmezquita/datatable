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
        this.initializeFromData(data);
    }

    private initializeFromData(data: T[]): void {
        for (const column of this._columns) {
            this._data[column] = data.map(row => row[column]);
        }
    }

    public query(
        filterFn?: (row: T) => boolean,
        operations?: {
            select?: (keyof T)[],
            assign?: { [K in keyof T]?: (row: T, index: number) => T[K] }
        },
        options?: {
            by?: keyof T | (keyof T)[],
            SD?: (keyof T)[]
        }
    ): DataTable<T> {
        // Implementation to be added
        throw new Error("Method not implemented.");
    }

    public setkey(key: keyof T | (keyof T)[]): void {
        this._keys = new Set(Array.isArray(key) ? key : [key]);
    }

    public setorder(columns: (keyof T)[]): void {
        // Implementation to be added
        throw new Error("Method not implemented.");
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
        return JSON.stringify(
            Array.from({ length: this._rowCount }, (_, i) => {
                const row = {} as T;
                for (const column of this._columns) {
                    row[column] = this._data[column][i];
                }
                return row;
            }),
            null,
            2
        );
    }
}