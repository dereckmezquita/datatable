import { DataTable } from "./DataTable/DT_col";

const DT = new DataTable([
    { id: 1, name: 'Alice', age: 30 },
    { id: 2, name: 'Bob', age: 25 },
    { id: 3, name: 'Charlie', age: 35 }
]);

console.log(DT);