import { DataTable } from './DataTable/DT_col5';

const DT = new DataTable([
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
DT.query(undefined, {
    assign: {
        ageGroup: (row) => (row.age < 30 ? 'Young' : 'Senior'),
        description: (row) => `${row.name} is ${row.age} years old`
    }
});

// TS inferred: const DT: DataTable<Person>
DT;

// ERROR HERE: Property 'ageGroup' does not exist on type '{ id: number; name: string; age: number; }'
DT.query((row) => row.ageGroup === 'Young');
