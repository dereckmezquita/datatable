import fs from 'fs';
import { DataTable, type DataType } from '../DataTable';

export function fread(filePath: string): DataTable {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent
        .split('\n')
        .filter((line: string) => line.trim() !== '');
    const headers = lines[0].split(',').map((header: string) => header.trim());

    const data: Record<string, DataType[]> = {};
    headers.forEach((header: string) => {
        data[header] = [];
    });

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((value: string) => value.trim());
        headers.forEach((header: string, index: number) => {
            const value = values[index];
            data[header].push(isNaN(Number(value)) ? value : Number(value));
        });
    }

    return new DataTable(data);
}
