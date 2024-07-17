import { DataTable } from './DataTable/DT_col';

interface Person {
    id: number;
    name: string;
    age: number;
}

const DT = new DataTable<Person>([
    { id: 1, name: 'Alice', age: 30 },
    { id: 2, name: 'Bob', age: 25 },
    { id: 3, name: 'Charlie', age: 35 },
    { id: 4, name: 'David', age: 20 },
    { id: 5, name: 'Eve', age: 15 },
    { id: 6, name: 'Frank', age: 40 }
]);

// R: DT[age >= 18, .(name, age)]
// TYPE INFERRED DataTable<{ name: string; age: number; }>
const adults = DT.query<{ name: string; age: number }>(
    (row) => row.age >= 10 && row.age < 30,
    {
        select: ['name', 'age'] as const
    }
);

console.log(adults.toString());
