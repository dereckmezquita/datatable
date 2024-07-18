import { DataTable } from './DataTable/DT_col4';

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

// R: DT[, `:=`(
//      ageGroup = ifelse(age < 30, "Young", "Senior"),
//      description = paste(name, "is", age, "years old")
//    )]
const DT2 = DT.query<Person & { ageGroup: string; description: string }>(
    undefined,
    {
        assign: {
            ageGroup: (row) => (row.age < 30 ? 'Young' : 'Senior'),
            description: (row) => `${row.name} is ${row.age} years old`
        }
    }
);

// TS inferred: const DT: DataTable<Person>
DT;
// TS inferred: const DT2: DataTable<Person & { ageGroup: string; description: string; }>
DT2;

// ERROR HERE: Property 'ageGroup' does not exist on type 'Person'.ts(2339)
DT.query((row) => row.ageGroup === 'Young');
// NO ERRRO ON DT2
DT2.query((row) => row.ageGroup === 'Young');
