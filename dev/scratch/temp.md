# DataTable.ts

DataTable.ts is a TypeScript implementation inspired by R's data.table package. It provides efficient data manipulation capabilities for tabular data.

## Usage

### Creating a DataTable

You can define the structure of your data using an interface:

```typescript
import { DataTable } from 'data-table-ts';

interface Person {
    id: number;
    name: string;
    age: number;
}

const DT = new DataTable<Person>([
    { id: 1, name: 'Alice', age: 30 },
    { id: 2, name: 'Bob', age: 25 },
    { id: 3, name: 'Charlie', age: 35 }
]);
```

### Basic Querying

```typescript
// R: DT[age >= 18, .(name, age)]
const adults = DT.query(
    row => row.age >= 18,
    { select: ['name', 'age'] }
);
```

### Adding/Updating Columns

```typescript
// R: DT[, `:=`(
//      ageGroup = ifelse(age < 30, "Young", "Senior"),
//      description = paste(name, "is", age, "years old")
//    )]
DT.query(null, {
    assign: {
        ageGroup: row => row.age < 30 ? 'Young' : 'Senior',
        description: row => `${row.name} is ${row.age} years old`
    }
});
```

### Aggregations

```typescript
// R: DT[, .(avgAge = mean(age))]
const avgAge = DT.query({
    avgAge: rows => rows.reduce((sum, row) => sum + row.age, 0) / rows.length
});
```

### Group By with Aggregation

```typescript
// R: DT[, .(minAge = min(age), maxAge = max(age)), by = name]
const ageStats = DT.query(
    null,
    {
        minAge: group => Math.min(...group.map(row => row.age)),
        maxAge: group => Math.max(...group.map(row => row.age))
    },
    { by: 'name' }
);
```

### Adding Rows

```typescript
// R: DT <- rbindlist(list(DT, data.table(id = 4, name = "David", age = 40)))
DT.addRow({ id: 4, name: 'David', age: 40 });

// R: DT <- rbindlist(list(DT, data.table(id = 5:6, name = c("Eve", "Frank"), age = c(28, 33))))
DT.addRows([
    { id: 5, name: 'Eve', age: 28 },
    { id: 6, name: 'Frank', age: 33 }
]);
```

### Setting Keys

```typescript
// R: setkey(DT, id)
DT.setkey('id');
```

### Ordering

```typescript
// R: setorder(DT, name, age)
DT.setorder(['name', 'age']);
```

## Note

This implementation is still in progress. Some methods like `join`, `melt`, `dcast`, and complex `.SD` operations are planned but not yet implemented.