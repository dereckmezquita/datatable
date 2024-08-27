# @dereckmezquita/datatable

```typescript
import { DataTable } from 'data-table-ts';

// Create a new DataTable
// R: DT <- data.table(id = 1:3, name = c("Alice", "Bob", "Charlie"), age = c(30, 25, 35))
const DT = new DataTable([
  { id: 1, name: 'Alice', age: 30 },
  { id: 2, name: 'Bob', age: 25 },
  { id: 3, name: 'Charlie', age: 35 }
]);

// Basic querying
// R: DT[age >= 18, .(name, age)]
DT.query(
  row => row.age >= 18,
  { select: ['name', 'age'] }
);

// Adding/updating columns
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

// Aggregations
// R: DT[, .(avgAge = mean(age))]
const avgAge = DT.query({
  avgAge: rows => rows.reduce((sum, row) => sum + row.age, 0) / rows.length
});

// Group by with aggregation
// R: DT[, .(minAge = min(age), maxAge = max(age)), by = name]
const ageStats = DT.query(
  null,
  {
    minAge: group => Math.min(...group.map(row => row.age)),
    maxAge: group => Math.max(...group.map(row => row.age))
  },
  { by: 'name' }
);

// Updating with condition
// R: DT[age >= 18, isAdult := TRUE]
DT.query(row => row.age >= 18, { assign: { isAdult: () => true } });

// Adding rows
// R: DT <- rbindlist(list(DT, data.table(id = 4, name = "David", age = 40)))
DT.addRow({ id: 4, name: 'David', age: 40 });

// R: DT <- rbindlist(list(DT, data.table(id = 5:6, name = c("Eve", "Frank"), age = c(28, 33))))
DT.addRows([
  { id: 5, name: 'Eve', age: 28 },
  { id: 6, name: 'Frank', age: 33 }
]);

// Joining
// R: DTJobs <- data.table(id = c(1,2,4), job = c("Engineer", "Designer", "Manager"))
const DTJobs = new DataTable([
  { id: 1, job: 'Engineer' },
  { id: 2, job: 'Designer' },
  { id: 4, job: 'Manager' }
]);

// R: joined <- DT[DTJobs, on = .(id)]
const joined = DT.join(DTJobs, ['id']);

// R: leftJoined <- DT[DTJobs, on = .(id), nomatch = 0L]
const leftJoined = DT.leftJoin(DTJobs, ['id']);

// Chaining operations
// R: result <- DT[age > 25, .(name, age, ageGroup = ifelse(age < 30, "Young", "Senior"))
//                ][, .(count = .N, avgAge = mean(age)), by = ageGroup]
const result = DT.query(
  row => row.age > 25,
  {
    select: ['name', 'age'],
    assign: { ageGroup: row => row.age < 30 ? 'Young' : 'Senior' }
  }
).query(
  null,
  {
    count: group => group.length,
    avgAge: group => group.reduce((sum, row) => sum + row.age, 0) / group.length
  },
  { by: 'ageGroup' }
);

// Setting keys
// R: setkey(DT, id)
DT.setKey('id');

// Ordering
// R: setorder(DT, name, age)
DT.setorder(['name', 'age']);

// .SD operations
// R: DT[, lapply(.SD, mean), by = ageGroup, .SDcols = c("age", "id")]
DT.query(
  null,
  row => ({
    avgAge: row.SD.age.reduce((sum, age) => sum + age, 0) / row.SD.age.length,
    avgId: row.SD.id.reduce((sum, id) => sum + id, 0) / row.SD.id.length
  }),
  { by: 'ageGroup', SD: ['age', 'id'] }
);

// .N usage
// R: DT[, .(.N), by = ageGroup]
DT.query(
  null,
  row => ({ count: row.N }),
  { by: 'ageGroup' }
);

// Complex operations with .SD and .I
// R: DT[, .SD[which.max(age)], by = ageGroup]
DT.query(
  null,
  row => row.SD[row.SD.age.indexOf(Math.max(...row.SD.age))],
  { by: 'ageGroup', SD: true }
);

// Nested queries
// R: DT[, .(subgroup = .(age)), by = ageGroup][, lapply(subgroup, mean)]
DT.query(
  null,
  row => ({ subgroup: row.SD.age }),
  { by: 'ageGroup', SD: ['age'] }
).query(null, {
  avgAge: row => row.subgroup.reduce((sum, ages) => sum + ages.reduce((s, a) => s + a, 0) / ages.length, 0) / row.subgroup.length
});

// Using .I for row numbers
// R: DT[, rowNum := .I]
DT.query(null, { assign: { rowNum: (_, i) => i + 1 } });

// Cross joins
// R: CJ(x = 1:2, y = c("A", "B"))
const crossJoined = DataTable.CJ(
  { x: [1, 2] },
  { y: ['A', 'B'] }
);

// Melt (unpivot)
// R: melt(DT, id.vars = c("id", "name"), measure.vars = c("age", "rowNum"))
const melted = DT.melt(['id', 'name'], ['age', 'rowNum']);

// Dcast (pivot)
// R: dcast(melted, id + name ~ variable, value.var = "value")
const casted = melted.dcast(['id', 'name'], 'variable', 'value');
```