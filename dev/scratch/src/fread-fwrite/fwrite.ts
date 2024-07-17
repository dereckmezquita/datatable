import fs from 'fs';
import { DataTable } from '../DataTable/DT_col3';

interface FwriteOptions {
    separator?: string;
    quote?: string;
    header?: boolean;
    na?: string;
    append?: boolean;
}

function escapeValue(value: any, quote: string): string {
    const stringValue = String(value);
    if (stringValue.includes(quote) || stringValue.includes('\n')) {
        return `${quote}${stringValue.replace(new RegExp(quote, 'g'), quote + quote)}${quote}`;
    }
    return stringValue;
}

function dataTableToCSV<T extends Record<string, any>>(
    dataTable: DataTable<T>,
    options: FwriteOptions
): string {
    const { separator = ',', quote = '"', header = true, na = '' } = options;
    const columns = dataTable['_columns'];
    const rows = dataTable['_rowCount'];

    let csv = '';

    // Write header
    if (header) {
        csv +=
            columns.map((col) => escapeValue(col, quote)).join(separator) +
            '\n';
    }

    // Write data rows
    for (let i = 0; i < rows; i++) {
        const row = columns.map((col) => {
            const value = dataTable['_data'][col][i];
            return value === null || value === undefined
                ? na
                : escapeValue(value, quote);
        });
        csv += row.join(separator) + '\n';
    }

    return csv;
}

export function fwriteSync<T extends Record<string, any>>(
    dataTable: DataTable<T>,
    filePath: string,
    options: FwriteOptions = {}
): void {
    const { append = false } = options;
    const csv = dataTableToCSV(dataTable, options);

    if (append) {
        fs.appendFileSync(filePath, csv);
    } else {
        fs.writeFileSync(filePath, csv);
    }
}

export async function fwrite<T extends Record<string, any>>(
    dataTable: DataTable<T>,
    filePath: string,
    options: FwriteOptions = {}
): Promise<void> {
    const { append = false } = options;
    const csv = dataTableToCSV(dataTable, options);

    if (append) {
        await fs.promises.appendFile(filePath, csv);
    } else {
        await fs.promises.writeFile(filePath, csv);
    }
}
