export class DataTable_Row {
    private _data: Record<string, any>[];
    private _columns: Map<string, string>;
    private _keys: Set<string>;

    constructor(data: Record<string, any>[]) {
        this._data = [];
        this._columns = new Map();
        this._keys = new Set();

        this.initializeFromData(data);
    }

    private initializeFromData(data: Record<string, any>[]): void {
        if (data.length === 0) {
            return;
        }

        // Infer column types from the first row
        const firstRow = data[0];
        for (const [key, value] of Object.entries(firstRow)) {
            const type = this.inferType(value);
            this._columns.set(key, type);
        }

        // Validate and add each row
        for (const row of data) {
            this.validateRow(row);
            this._data.push(row);
        }
    }

    private inferType(value: any): string {
        if (typeof value === 'number') {
            return Number.isInteger(value) ? 'integer' : 'float';
        } else if (typeof value === 'string') {
            return 'string';
        } else if (typeof value === 'boolean') {
            return 'boolean';
        } else if (value instanceof Date) {
            return 'date';
        } else {
            return 'object';
        }
    }

    private validateRow(row: Record<string, any>): void {
        for (const [key, expectedType] of this._columns) {
            if (!(key in row)) {
                throw new Error(`Missing column "${key}" in row`);
            }
            const actualType = this.inferType(row[key]);
            if (actualType !== expectedType) {
                throw new Error(
                    `Type mismatch for column "${key}": expected ${expectedType}, got ${actualType}`
                );
            }
        }
    }

    public toString(): string {
        return JSON.stringify(this._data, null, 2);
    }
}
