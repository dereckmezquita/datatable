import { DataTable } from './DataTable/DT_col3';
import { freadSync } from './fread-fwrite/fread';
import { fwriteSync } from './fread-fwrite/fwrite';

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

// console.log(adults.toString());

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

const iris = freadSync('./data/iris.csv', {
    colClasses: {
        'Sepal.Length': Number,
        'Sepal.Width': Number,
        'Petal.Length': Number,
        'Petal.Width': Number,
        Species: String
    }
});

console.log(iris);

const smallIris = iris.query((row) => row.Species === 'setosa', {
    select: ['Species', 'Sepal.Width', 'Petal.Length'] as const
});
console.log(smallIris.toString());

fwriteSync(smallIris, './output/output.csv', {
    separator: ',',
    quote: '"',
    header: true,
    na: 'NA',
    append: true
});
