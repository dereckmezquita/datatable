import fs from 'fs';
import readline from 'readline';
import { DataTable } from '../DataTable/DT_col3';

type BasicType = 'string' | 'number' | 'boolean' | 'Date';
type TypeCoercion<T> = BasicType | ((value: string) => T);

interface FreadOptions<T> {
    header?: boolean;
    separator?: string;
    quote?: string;
    skipRows?: number;
    select?: (keyof T)[];
    colClasses?: { [K in keyof T]?: TypeCoercion<T[K]> };
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

    lines.forEach((line) => {
        const values = line
            .split(separator)
            .map((v) =>
                v.trim().replace(new RegExp(`^${quote}|${quote}$`, 'g'), '')
            );

        columns.forEach((col) => {
            if (select && !headerRow.includes(col as string)) {
                throw new Error(
                    `Selected column "${String(col)}" not found in CSV`
                );
            }

            const value = values[headerRow.indexOf(col as string)];

            if (colClasses && col in colClasses) {
                const typeCoercion = colClasses[col];
                if (typeof typeCoercion === 'function') {
                    data[col]!.push(typeCoercion(value));
                } else {
                    switch (typeCoercion) {
                        case 'string':
                            data[col]!.push(value as T[keyof T]);
                            break;
                        case 'number':
                            data[col]!.push(Number(value) as T[keyof T]);
                            break;
                        case 'boolean':
                            data[col]!.push(
                                (value.toLowerCase() === 'true') as T[keyof T]
                            );
                            break;
                        case 'Date':
                            data[col]!.push(new Date(value) as T[keyof T]);
                            break;
                    }
                }
            } else {
                data[col]!.push(value as T[keyof T]);
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
    const lines = content
        .split('\n')
        .slice(skipRows)
        .filter((line) => line.trim() !== '');

    // Validate data structure
    const firstLineColumns = lines[0].split(options.separator || ',').length;
    const lastLineColumns = lines[lines.length - 1].split(
        options.separator || ','
    ).length;
    if (firstLineColumns !== lastLineColumns) {
        throw new Error('Inconsistent number of columns in the data');
    }

    return processLines(lines, options);
}

export async function fread<T extends Record<string, any>>(
    filePath: string,
    options: FreadOptions<T> = {}
): Promise<DataTable<T>> {
    const { skipRows = 0 } = options;

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
        if (lineCount >= skipRows && line.trim() !== '') {
            lines.push(line);
            if (lineCount === skipRows) {
                firstLineColumns = line.split(options.separator || ',').length;
            }
            lastLineColumns = line.split(options.separator || ',').length;
        }
        lineCount++;
    }

    if (firstLineColumns !== lastLineColumns) {
        throw new Error('Inconsistent number of columns in the data');
    }

    return processLines(lines, options);
}
