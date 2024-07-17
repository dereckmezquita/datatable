import fs from 'fs';
import { DataTable } from '../DataTable/DT_col3';

type InferredType = string | number | boolean | Date | null;

function inferType(value: string): InferredType {
    if (value === '') return null;
    if (value === 'true' || value === 'false') return value === 'true';
    if (!isNaN(Number(value))) return Number(value);
    if (!isNaN(Date.parse(value))) return new Date(value);
    return value;
}

export function fread(
    filePath: string,
    options: {
        header?: boolean;
        separator?: string;
        quote?: string;
        skipRows?: number;
        select?: string[];
        colClasses?: {
            [key: string]: 'string' | 'number' | 'boolean' | 'Date';
        };
    } = {}
): DataTable<any> {
    const {
        header = true,
        separator = ',',
        quote = '"',
        skipRows = 0,
        select,
        colClasses
    } = options;

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').slice(skipRows);

    if (lines.length === 0) {
        throw new Error('Empty file or all rows skipped');
    }

    const headerRow = header ? lines.shift()!.split(separator) : [];
    const columns = select || headerRow;

    const data: { [key: string]: any[] } = {};
    columns.forEach((col) => (data[col] = []));

    let columnTypes: { [key: string]: InferredType } = {};

    lines.forEach((line, lineIndex) => {
        const values = line
            .split(separator)
            .map((v) =>
                v.trim().replace(new RegExp(`^${quote}|${quote}$`, 'g'), '')
            );

        columns.forEach((col, index) => {
            if (select && !headerRow.includes(col)) {
                throw new Error(`Selected column "${col}" not found in CSV`);
            }

            const value = values[headerRow.indexOf(col)];

            if (lineIndex === 0) {
                columnTypes[col] = inferType(value);
            }

            if (colClasses && colClasses[col]) {
                switch (colClasses[col]) {
                    case 'string':
                        data[col].push(value);
                        break;
                    case 'number':
                        data[col].push(Number(value));
                        break;
                    case 'boolean':
                        data[col].push(value.toLowerCase() === 'true');
                        break;
                    case 'Date':
                        data[col].push(new Date(value));
                        break;
                }
            } else {
                data[col].push(inferType(value));
            }
        });
    });

    // Create a type that matches the inferred or specified column types
    type InferredRowType = {
        [K in keyof typeof data]: (typeof data)[K] extends (infer T)[]
            ? T
            : never;
    };

    return new DataTable<InferredRowType>(data);
}
