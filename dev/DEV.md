# Detailed Implementation Plan for DataTable.ts

## 1. DataTable Class Implementation

### 1.1 Constructor
1. Define the constructor signature: `constructor(data: Record<string, any>[])`
2. Initialise internal data storage (consider using a Map or an array of objects)
3. Implement type inference for columns based on input data
4. Set up any necessary metadata (column names, types, etc.)

Example of usage and expected outcome:
```typescript
const DT = new DataTable([
  { id: 1, name: 'Alice', age: 30 },
  { id: 2, name: 'Bob', age: 25 }
]);
console.log(DT); // Should display a structured representation of the data
```

### 1.2 Core Properties
1. `_data`: Private property to store the actual data (array of objects or Map)
2. `_columns`: Private property to store column metadata (names, types)
3. `_keys`: Private property to store key column information

### 1.3 Basic Methods
1. `addRow(row: Record<string, any>): void`
   - Validate row against column structure
   - Add row to internal data storage
   - Update any necessary metadata

2. `addRows(rows: Record<string, any>[]): void`
   - Iterate over rows, calling addRow for each

3. `setKey(key: string | string[]): void`
   - Validate key(s) against existing columns
   - Set up internal indexing structure for fast lookups

4. `setorder(columns: string[]): void`
   - Implement sorting logic based on specified columns
   - Consider using a stable sorting algorithm

Example of usage and expected outcome:
```typescript
DT.addRow({ id: 3, name: 'Charlie', age: 35 });
DT.addRows([
  { id: 4, name: 'David', age: 40 },
  { id: 5, name: 'Eve', age: 28 }
]);
DT.setKey('id');
DT.setorder(['age', 'name']);
console.log(DT); // Should display the updated and sorted data
```

## 2. Query Method Implementation

### 2.1 Basic Structure
1. Define method signature: 
   ```typescript
   query(
     filterFn?: (row: Record<string, any>) => boolean,
     operations?: {
       select?: string[],
       assign?: Record<string, (row: Record<string, any>) => any>
     },
     options?: {
       by?: string | string[],
       SD?: string[] | boolean
     }
   ): DataTable | any
   ```
2. Implement logic to handle each parameter independently

### 2.2 Filtering (i operation)
1. If filterFn is provided, apply it to each row in _data
2. Create a new filtered dataset

Example of usage and expected outcome:
```typescript
const adults = DT.query(row => row.age >= 18);
console.log(adults); // Should display only rows where age is 18 or greater
```

### 2.3 Column Operations (j operation)
1. Implement select operation
   - If select is provided, create a new dataset with only specified columns

2. Implement assign operation
   - If assign is provided, apply each function to create new columns or modify existing ones

Example of usage and expected outcome:
```typescript
const namesAndAges = DT.query(null, { select: ['name', 'age'] });
console.log(namesAndAges); // Should display only name and age columns

DT.query(null, {
  assign: {
    ageGroup: row => row.age < 30 ? 'Young' : 'Senior',
    description: row => `${row.name} is ${row.age} years old`
  }
});
console.log(DT); // Should display the original data with two new columns
```

### 2.4 Grouping (by operation)
1. If 'by' is provided, implement grouping logic
   - Create a Map or object to hold grouped data
   - Iterate through data, placing each row into appropriate group

### 2.5 .SD (Subset of Data) Implementation
1. If SD is true or an array of column names, create subset of data for each group
2. Implement logic to make SD available in assign and aggregation functions

### 2.6 Aggregation
1. Implement logic to detect and perform aggregations
2. Handle both grouped and non-grouped aggregations

Example of usage and expected outcome:
```typescript
const ageStats = DT.query(
  null,
  {
    minAge: group => Math.min(...group.map(row => row.age)),
    maxAge: group => Math.max(...group.map(row => row.age))
  },
  { by: 'ageGroup' }
);
console.log(ageStats); // Should display min and max age for each age group
```

### 2.7 Chaining
1. Ensure query method returns a new DataTable instance for chainability
2. Implement logic to optimise chains of queries (lazy evaluation)

Example of usage and expected outcome:
```typescript
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
console.log(result); // Should display count and average age for each age group, only for those over 25
```

## 3. Join Operations

### 3.1 join Method
1. Define method signature: `join(other: DataTable, keys: string[]): DataTable`
2. Implement hash join algorithm for efficiency
3. Handle cases where keys don't match

### 3.2 leftJoin Method
1. Define method signature: `leftJoin(other: DataTable, keys: string[]): DataTable`
2. Modify join algorithm to keep all rows from the left table

Example of usage and expected outcome:
```typescript
const DTJobs = new DataTable([
  { id: 1, job: 'Engineer' },
  { id: 2, job: 'Designer' },
  { id: 4, job: 'Manager' }
]);

const joined = DT.join(DTJobs, ['id']);
console.log(joined); // Should display rows with matching ids, including job information

const leftJoined = DT.leftJoin(DTJobs, ['id']);
console.log(leftJoined); // Should display all rows from DT, with job information where available
```

## 4. Advanced Operations

### 4.1 melt Method
1. Define method signature: `melt(idVars: string[], measureVars: string[]): DataTable`
2. Implement logic to restructure data from wide to long format

### 4.2 dcast Method
1. Define method signature: `dcast(idVars: string[], variable: string, value: string): DataTable`
2. Implement logic to restructure data from long to wide format

Example of usage and expected outcome:
```typescript
const melted = DT.melt(['id', 'name'], ['age', 'ageGroup']);
console.log(melted); // Should display data in long format

const casted = melted.dcast(['id', 'name'], 'variable', 'value');
console.log(casted); // Should display data back in wide format
```

### 4.3 CJ (Cross Join) Static Method
1. Define static method signature: `static CJ(...args: Record<string, any>[]): DataTable`
2. Implement cross join logic to create all combinations of input values

Example of usage and expected outcome:
```typescript
const crossJoined = DataTable.CJ(
  { x: [1, 2] },
  { y: ['A', 'B'] }
);
console.log(crossJoined); // Should display all combinations: (1,A), (1,B), (2,A), (2,B)
```

## 5. Optimisation Techniques

### 5.1 Indexing
1. Implement indexing structure for key columns
2. Modify query and join methods to utilise indexes when available

### 5.2 Lazy Evaluation
1. Implement a query plan structure to represent chains of operations
2. Modify query method to build up query plan instead of executing immediately
3. Implement execute method to run query plan efficiently

### 5.3 Memory Management
1. Implement streaming techniques for handling large datasets
2. Consider implementing a chunking mechanism for processing large datasets in parts

Example of performance improvement:
```typescript
console.time('query');
const result = DT.query(/* complex query here */);
console.timeEnd('query'); // Should show significant improvement after optimisation
```

## 6. Testing Strategy

1. Unit tests for each method and major functionality
2. Integration tests for complex operations and chaining
3. Performance tests, especially for large datasets
4. Edge case testing (empty datasets, type mismatches, etc.)

Example of a test case:
```typescript
test('filtered query returns correct number of rows', () => {
  const DT = new DataTable(/* sample data */);
  const result = DT.query(row => row.age > 30);
  expect(result.length).toBe(/* expected number of rows */);
});
```

This detailed plan breaks down the implementation of the DataTable class and its methods into specific, actionable steps. It covers the core functionality, advanced features, and optimisation techniques. The added examples for each major section provide concrete goals and expected outcomes, making it easier to track progress and ensure correct implementation.