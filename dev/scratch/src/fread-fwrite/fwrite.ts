import fs from 'fs';
import { DataTable } from '../DataTable/DT_col3';

interface FwriteOptions {
    separator?: string;
    quote?: string;
    header?: boolean;
    na?: string;
    append?: boolean; // TODO: revise the append option
    chunkSize?: number;
}

function escapeValue(value: any, quote: string): string {
    const stringValue = String(value);
    if (stringValue.includes(quote) || stringValue.includes('\n')) {
        return `${quote}${stringValue.replace(new RegExp(quote, 'g'), quote + quote)}${quote}`;
    }
    return stringValue;
}

function* dataTableRowGenerator<T extends Record<string, any>>(
    dataTable: DataTable<T>,
    options: FwriteOptions
): Generator<string, void, unknown> {
    const { separator = ',', quote = '"', header = true, na = '' } = options;
    const columns = dataTable['_columns'];
    const rows = dataTable['_rowCount'];

    // Yield header
    if (header) {
        yield columns.map((col) => escapeValue(col, quote)).join(separator) +
            '\n';
    }

    // Yield data rows
    for (let i = 0; i < rows; i++) {
        const row = columns.map((col) => {
            const value = dataTable['_data'][col][i];
            return value === null || value === undefined
                ? na
                : escapeValue(value, quote);
        });
        yield row.join(separator) + '\n';
    }
}

export function fwriteSync<T extends Record<string, any>>(
    dataTable: DataTable<T>,
    filePath: string,
    options: FwriteOptions = {}
): void {
    const { append = false, chunkSize = 1000 } = options;
    const writeStream = append
        ? fs.createWriteStream(filePath, { flags: 'a' })
        : fs.createWriteStream(filePath);

    const rowGenerator = dataTableRowGenerator(dataTable, options);

    let chunk = '';
    for (const row of rowGenerator) {
        chunk += row;
        if (chunk.length >= chunkSize) {
            writeStream.write(chunk);
            chunk = '';
        }
    }

    if (chunk) {
        writeStream.write(chunk);
    }

    writeStream.end();
}

export async function fwrite<T extends Record<string, any>>(
    dataTable: DataTable<T>,
    filePath: string,
    options: FwriteOptions = {}
): Promise<void> {
    const { append = false, chunkSize = 1000 } = options;
    const writeStream = append
        ? fs.createWriteStream(filePath, { flags: 'a' })
        : fs.createWriteStream(filePath);

    const rowGenerator = dataTableRowGenerator(dataTable, options);

    let chunk = '';
    for (const row of rowGenerator) {
        chunk += row;
        if (chunk.length >= chunkSize) {
            await new Promise<void>((resolve, reject) => {
                writeStream.write(chunk, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });
            chunk = '';
        }
    }

    if (chunk) {
        await new Promise<void>((resolve, reject) => {
            writeStream.write(chunk, (error) => {
                if (error) reject(error);
                else resolve();
            });
        });
    }

    await new Promise<void>((resolve, reject) => {
        writeStream.end((error: any) => {
            if (error) reject(error);
            else resolve();
        });
    });
}
