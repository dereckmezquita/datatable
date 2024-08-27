import { DataTable, DataType } from '../DataTable';
import * as fs from 'fs';

interface FreadOptions {
    file?: string;
    text?: string;
    sep?: string;
    header?: boolean;
    nrows?: number;
    skip?: number;
    select?: string[] | number[];
    colClasses?: Record<string, string>;
    na_strings?: string[];
    stripWhite?: boolean;
    encoding?: BufferEncoding;
}

/**
 * Reads a CSV file or string and returns a DataTable.
 *
 * @param options - Configuration options for reading the file
 * @returns A DataTable containing the parsed data
 *
 * @example
 * const dt = fread({ file: 'data.csv', sep: ',', header: true });
 * dt.print();
 */
export function fread(options: FreadOptions): DataTable {
    let input: string;

    if (options.file) {
        input = fs.readFileSync(options.file, options.encoding || 'utf8');
    } else if (options.text) {
        input = options.text;
    } else {
        throw new Error('Either file or text must be provided');
    }

    const lines = input.split(/\r?\n/);
    const sep = options.sep || detectSeparator(lines[0]);
    const header = options.header !== false;
    const skip = options.skip || 0;
    const nrows = options.nrows || Infinity;
    const na_strings = options.na_strings || ['NA'];
    const stripWhite = options.stripWhite !== false;

    let colNames: string[];
    let startRow: number;

    if (header) {
        colNames = parseRow(lines[skip], sep, stripWhite);
        startRow = skip + 1;
    } else {
        colNames = generateColumnNames(
            parseRow(lines[skip], sep, stripWhite).length
        );
        startRow = skip;
    }

    const selectedCols = selectColumns(colNames, options.select);
    const data: Record<string, DataType[]> = {};

    selectedCols.forEach((col) => {
        data[col] = [];
    });

    for (let i = startRow; i < Math.min(lines.length, startRow + nrows); i++) {
        const row = parseRow(lines[i], sep, stripWhite);
        if (row.length === selectedCols.length) {
            selectedCols.forEach((col, j) => {
                const value = row[j];
                data[col].push(
                    parseValue(value, options.colClasses?.[col], na_strings)
                );
            });
        }
    }

    return new DataTable(data);
}

function detectSeparator(line: string): string {
    const separators = [',', '\t', ';', '|'];
    let maxCount = 0;
    let bestSep = ',';

    for (const sep of separators) {
        const count = (line.match(new RegExp(sep, 'g')) || []).length;
        if (count > maxCount) {
            maxCount = count;
            bestSep = sep;
        }
    }

    return bestSep;
}

function parseRow(line: string, sep: string, stripWhite: boolean): string[] {
    const values = line.split(sep);
    return stripWhite ? values.map((v) => v.trim()) : values;
}

function generateColumnNames(count: number): string[] {
    return Array.from({ length: count }, (_, i) => `V${i + 1}`);
}

function selectColumns(
    colNames: string[],
    select?: string[] | number[]
): string[] {
    if (!select) return colNames;

    if (typeof select[0] === 'string') {
        return select as string[];
    } else {
        return (select as number[]).map((i) => colNames[i]);
    }
}

function parseValue(
    value: string,
    colClass: string | undefined,
    na_strings: string[]
): DataType {
    if (na_strings.includes(value)) return null;

    switch (colClass) {
        case 'number':
            return parseFloat(value);
        case 'boolean':
            return value.toLowerCase() === 'true';
        default:
            return value;
    }
}

// Example usage
// const dt = fread({
//     file: 'data.csv',
//     sep: ',',
//     header: true,
//     colClasses: { age: 'number', isStudent: 'boolean' },
//     na_strings: ['NA', ''],
// });
// dt.print();
