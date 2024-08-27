import fs from 'fs';
import readline from 'readline';
import { DataTable } from '../DataTable/DT_col3';

// Define the basic types that can be used for type coercion
type BasicType = 'string' | 'number' | 'boolean' | 'Date';

// TypeCoercion can be either a basic type string or a custom function
type TypeCoercion<T> = ((value: string) => T) | BasicType;

// Options interface for fread functions
interface FreadOptions<T> {
    header?: boolean;
    separator?: string;
    quote?: string;
    skipRows?: number;
    select?: (keyof T)[];
    colClasses?: { [K in keyof T]?: TypeCoercion<T[K]> };
}

// Function to infer the type of a value
function inferType(value: string): BasicType {
    if (value === '') return 'string';
    if (value === 'true' || value === 'false') return 'boolean';
    if (!isNaN(Number(value))) return 'number';
    if (!isNaN(Date.parse(value))) return 'Date';
    return 'string';
}

// Function to coerce a value based on the inferred or specified type
function coerceValue(
    value: string,
    type: BasicType | ((value: string) => any)
): any {
    if (typeof type === 'function') {
        return type(value);
    }

    switch (type) {
        case 'string':
            return value;
        case 'number':
            return Number(value);
        case 'boolean':
            return value.toLowerCase() === 'true';
        case 'Date':
            return new Date(value);
        default:
            return value;
    }
}

function processLines<T extends Record<string, any>>(
    lines: string[],
    options: FreadOptions<T>
): DataTable<T> {
    const {
        header = true,
        separator = ',',
        quote = '"',
        select,
        colClasses
    } = options;

    if (lines.length === 0) {
        throw new Error('Empty file or all rows skipped');
    }

    const headerRow = header ? lines.shift()!.split(separator) : [];
    const columns = select || (headerRow as (keyof T)[]);

    const data: { [K in keyof T]?: T[K][] } = {};
    columns.forEach((col) => (data[col] = []));

    // Infer column types from the first data row if colClasses is not provided
    const inferredTypes: { [K in keyof T]?: BasicType } = {};
    if (!colClasses) {
        const firstDataRow = lines[0].split(separator);
        columns.forEach((col, index) => {
            inferredTypes[col] = inferType(firstDataRow[index]);
        });
    }

    lines.forEach((line) => {
        const values = line
            .split(separator)
            .map((v) =>
                v.trim().replace(new RegExp(`^${quote}|${quote}$`, 'g'), '')
            );

        columns.forEach((col, index) => {
            const value = values[index] || '';

            if (colClasses && col in colClasses) {
                data[col]!.push(coerceValue(value, colClasses[col]!));
            } else {
                data[col]!.push(
                    coerceValue(value, inferredTypes[col] || 'string')
                );
            }
        });
    });

    return new DataTable<T>(data as { [K in keyof T]: T[K][] });
}

export function freadSync<T extends Record<string, any>>(
    filePath: string,
    options: FreadOptions<T> = {}
): DataTable<T> {
    const { skipRows = 0 } = options;

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter((line) => line.trim() !== '');

    if (lines.length === 0) {
        throw new Error('Empty file or all rows skipped');
    }

    // Get header and first data line
    const headerRow = lines[skipRows].split(options.separator || ',');
    const firstDataRow = lines[skipRows + (options.header ? 1 : 0)].split(
        options.separator || ','
    );

    // Get last data line
    const lastDataRow = lines[lines.length - 1].split(options.separator || ',');

    // Check for consistency in column count
    if (firstDataRow.length !== lastDataRow.length) {
        console.warn(
            'Inconsistent number of columns in the data. Some values may be filled with null.'
        );
    }

    return processLines(lines.slice(skipRows), options);
}

export async function fread<T extends Record<string, any>>(
    filePath: string,
    options: FreadOptions<T> = {}
): Promise<DataTable<T>> {
    const { skipRows = 0, separator = ',' } = options;

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const lines: string[] = [];
    let lineCount = 0;
    let firstLineColumns = 0;
    let lastLineColumns = 0;

    for await (const line of rl) {
        if (line.trim() !== '') {
            if (lineCount === skipRows) {
                firstLineColumns = line.split(separator).length;
            }
            if (lineCount >= skipRows) {
                lines.push(line);
            }
            lastLineColumns = line.split(separator).length;
            lineCount++;
        }
    }

    if (firstLineColumns !== lastLineColumns) {
        console.warn(
            'Inconsistent number of columns in the data. Some values may be filled with null.'
        );
    }

    return processLines(lines, options);
}
