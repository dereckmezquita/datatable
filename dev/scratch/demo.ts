import { DataTable } from 'data-table-ts';
import {
    seq,
    inside,
    mean,
    Which,
    max,
    min,
    sum,
    rnorm,
    fintersect,
    fsetdiff,
    join,
    melt,
    dcast,
    merge,
    gt,
    lt,
    eq,
    between,
    shift
} from 'data-table-utils';

/**
 * Object creation from arrays
 *
 * @example
 * # R equivalent
 * dt <- data.table(
 *   id = 1:10,
 *   name = c("Alice", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Henry", "Ivy", "Jack"),
 *   age = c(25, 30, 35, 28, 22, 40, 33, 45, 27, 31),
 *   salary = c(50000, 60000, 75000, 55000, 45000, 80000, 70000, 90000, 52000, 65000),
 *   department = c("IT", "HR", "IT", "Finance", "HR", "IT", "Finance", "HR", "IT", "Finance")
 * )
 */
const dt = DataTable.fromArrays({
    id: seq(1, 10),
    name: [
        'Alice',
        'Bob',
        'Charlie',
        'David',
        'Eve',
        'Frank',
        'Grace',
        'Henry',
        'Ivy',
        'Jack'
    ],
    age: [25, 30, 35, 28, 22, 40, 33, 45, 27, 31],
    salary: [
        50000, 60000, 75000, 55000, 45000, 80000, 70000, 90000, 52000, 65000
    ],
    department: [
        'IT',
        'HR',
        'IT',
        'Finance',
        'HR',
        'IT',
        'Finance',
        'HR',
        'IT',
        'Finance'
    ]
});

/**
 * Column-wise selection
 * The j argument can be:
 *  - string[]: by name
 *  - number[]: by index
 *  - boolean[]: must be the same length as the number of columns
 *  - (dt) => boolean[]
 *
 * @example
 * # R equivalent
 * dt[, .(name, age)]
 * dt[, c(1, 3)]
 * dt[, c(TRUE, FALSE, TRUE, FALSE, FALSE)]
 * dt[, .SD, .SDcols = patterns("a")]
 */
dt.query(null, ['name', 'age']);
dt.query(null, [0, 2]);
dt.query(null, [true, false, true, false, false]);
dt.query(null, (d) => d.cols.map((c) => /a/.test(c)));

/**
 * Row-wise selection
 * i can be:
 *  - number[]: by index
 *  - boolean[]
 *  - (dt) => boolean[]
 *
 * @example
 * # R equivalent
 * dt[1:3]
 * dt[1:3]
 * dt[age > 25]
 * dt[age %between% c(26, 30)]
 */
dt.query([0, 1, 2]);
dt.query(seq(0, 2));
dt.query((d) => gt(d.age, 25));
dt.query((d) => inside(d.age, [26, 30]));

/**
 * Column-wise operations
 * DataTable.query does not update a DT, instead returns a new one
 *
 * j can be an object or function that returns an object
 * where keys are cols to update or create
 * - object: { colName: any[] | (dt) => any[] }
 * - (dt) => object
 *
 * @example
 * # R equivalent
 * dt_hw <- dt[, .(height = c(170, 180, 175, 182, 168, 178, 172, 185, 169, 176),
 *                 weight = rnorm(10, 75, 5))]
 */
const dt_hw = dt.query(null, {
    height: [170, 180, 175, 182, 168, 178, 172, 185, 169, 176],
    weight: rnorm(10, 75, 5)
});

/**
 * Update columns by reference
 * DataTable.set updates the DT in place
 *
 * @example
 * # R equivalent
 * dt[, ':='(height = c(170, 180, 175, 182, 168, 178, 172, 185, 169, 176),
 *           weight = rnorm(10, 75, 5))]
 */
dt.set(null, {
    height: [170, 180, 175, 182, 168, 178, 172, 185, 169, 176],
    weight: rnorm(10, 75, 5)
});

/**
 * Compute derived columns
 *
 *
 * @example
 * # R equivalent
 * dt[, ':='(
 *     bmi = weight / (height/100)^2,
 *     salary_category = ifelse(salary > 60000, "High", "Low")
 * )]
 */
dt.set(null, (d) => ({
    bmi: d.weight.map((w, i) => w / Math.pow(d.height[i] / 100, 2)),
    salary_category: d.salary.map((s) => (s > 60000 ? 'High' : 'Low'))
}));

/**
 * Remove columns
 *
 * @example
 * # R equivalent
 * dt[, c("bmi", "salary_category") := NULL]
 */
dt.set(null, {
    bmi: null,
    salary_category: null
});

/**
 * Compute summary statistics
 *
 * @example
 * # R equivalent
 * dt[, .(avg_age = mean(age), total_salary = sum(salary))]
 */
dt.query(null, (d) => ({
    avg_age: mean(d.age),
    total_salary: sum(d.salary)
}));

/**
 * Grouping operations
 * by can be:
 * - string: a single column name
 * - string[]: multiple column names
 * - (dt) => object: for complex grouping
 *
 * @example
 * # R equivalent
 * dt[, .(avg_salary = mean(salary)), by = department]
 *
 * dt[, .(avg_salary = mean(salary)), by = .(department, age > 30)]
 */
dt.query(null, (d) => ({ avg_salary: mean(d.salary) }), 'department');

dt.query(null, (d) => ({ avg_salary: mean(d.salary) }), [
    'department',
    (d) => gt(d.age, 30)
]);

/**
 * Complex grouping
 *
 * @example
 * # R equivalent
 * dt[, .(avg_salary = mean(salary)), by = .(dept = department, senior = age > 30)]
 */
dt.query(
    null,
    (d) => ({ avg_salary: mean(d.salary) }),
    (d) => ({
        dept: d.department,
        senior: gt(d.age, 30)
    })
);

/**
 * Grouping with set operation
 * This operation calculates the difference between each salary and the mean salary for each department.
 *
 * @example
 * # R equivalent
 * dt[, salary_diff := salary - mean(salary), by = department]
 */
dt.set(
    null,
    (d) => ({ salary_diff: d.salary.map((s) => s - mean(d.salary)) }),
    'department'
);

/**
 * Complex query with grouping, filtering, and computation
 * This query first filters rows where age > 30, then computes high_salary and avg_age for each department,
 * and finally filters the results to keep only rows where high_salary > 0.
 *
 * @example
 * # R equivalent
 * dt[age > 30, .(high_salary = sum(salary > 70000), avg_age = mean(age)), by = department][high_salary > 0]
 */
dt.query(
    (d) => gt(d.age, 30),
    (d) => ({
        high_salary: sum(gt(d.salary, 70000)),
        avg_age: mean(d.age)
    }),
    'department'
).query((d) => gt(d.high_salary, 0));

/**
 * Fast row access by key
 * This operation sets a key for fast row access and then queries a specific row.
 *
 * @example
 * # R equivalent
 * setkey(dt, name)
 * dt["Bob"]
 */
dt.setKey('name');
dt.query('Bob');

/**
 * Using both primary and secondary keys
 * This operation sets a secondary index and then performs a query using both primary and secondary keys.
 *
 * @example
 * # R equivalent
 * setindex(dt, age)
 * dt[.("Bob", 30), on = .(name, age)]
 */
dt.setIndex('age');
dt.query(['Bob', 30], { on: ['name', 'age'] });

/**
 * Automatic indexing
 * This setting enables automatic creation of indices when needed for join operations.
 *
 * @example
 * # R equivalent
 * options(datatable.auto.index = TRUE)
 * dt[.("Bob", 30), on = .(name, age)]
 */
DataTable.setOption('autoIndex', true);
dt.query(['Bob', 30], { on: ['name', 'age'] });

/**
 * TODO: rework this signature and syntax seems clunky and not consistent with the rest of the API
 * Apply function to subset of columns by group
 * This operation applies a function (mean in this case) to a subset of columns for each group.
 *
 * @example
 * # R equivalent
 * dt[, lapply(.SD, mean), by = .(age > 30), .SDcols = c("age", "salary")]
 *
 * # R output
 *    age salary
 * 1:  35  75000
 * 2:  40  80000
 * 3:  45  90000
 */
dt.query(
    null,
    (d) => d.cols.map((c) => mean(d[c])),
    (d) => gt(d.age, 30),
    { SDcols: ['age', 'salary'] }
);

/**
 * Count rows by group
 * This operation counts the number of rows in each group.
 *
 * @example
 * # R equivalent
 * dt[, .N, by = .(age > 30)]
 *
 * # R output
 *    age  N
 * 1:  35  1
 * 2:  40  1
 * 3:  45  1
 */
dt.query(
    null,
    (d) => ({ N: d.id.length }),
    (d) => gt(d.age, 30)
);

/**
 * Find index of maximum value by group
 * This operation finds the index of the maximum salary for each group.
 *
 * @example
 * # R equivalent
 * dt[, .I[which.max(salary)], by = .(age > 30)]
 */
dt.query(
    null,
    (d) => ({ I: d.id[Which.max(d.salary)] }),
    (d) => gt(d.age, 30)
);

/**
 * Assign group numbers
 * This operation assigns a group number to each row based on whether age > 30.
 *
 * @example
 * # R equivalent
 * dt[, grp := .GRP, by = .(age > 30)]
 *
 * # R output
 *    age salary grp
 * 1:  25  50000   1
 * 2:  30  60000   2
 * 3:  35  75000   3
 * 4:  28  55000   4
 */
dt.set(
    null,
    (d) => ({ grp: Which.rleid(gt(d.age, 30)) }),
    (d) => gt(d.age, 30)
);

/**
 * Access grouping variables
 * This operation returns the grouping variables for each group.
 *
 * @example
 * # R equivalent
 * dt[, .BY, by = .(age > 30)]
 */
dt.query(
    null,
    (d, { BY }) => BY,
    (d) => gt(d.age, 30)
);

/**
 * Assign group based on run-length encoding
 * This operation assigns a group number based on consecutive runs of age > 30.
 *
 * @example
 * # R equivalent
 * dt[, group := rleid(age > 30)]
 */
dt.set(null, (d) => ({ group: Which.rleid(gt(d.age, 30)) }));

/**
 * Shift values within groups
 * This operation creates a new column with the previous salary within each group.
 *
 * @example
 * # R equivalent
 * dt[, prev_salary := shift(salary), by = .(age > 30)]
 */
dt.set(
    null,
    (d) => ({ prev_salary: d.salary.map((s, i) => d.salary[i - 1]) }),
    (d) => gt(d.age, 30)
);
dt.set(
    null,
    (d) => ({ prev_salary: shift(d.salary) }),
    (d) => gt(d.age, 30)
);

/**
 * Join operations
 * These operations demonstrate various types of joins between DataTables.
 */

/**
 * Create a second DataTable for join operations
 *
 * @example
 * # R equivalent
 * dt2 <- data.table(
 *   name = c("Alice", "Bob", "Frank", "George"),
 *   department = c("HR", "IT", "Finance", "Marketing")
 * )
 */
const dt2 = DataTable.fromArrays({
    name: ['Alice', 'Bob', 'Frank', 'George'],
    department: ['HR', 'IT', 'Finance', 'Marketing']
});

/**
 * Inner join
 *
 * @example
 * # R equivalent
 * inner_join <- merge(dt, dt2, by = "name")
 */
const inner_join = join(dt, dt2, { on: 'name' });

/**
 * Left join
 *
 * @example
 * # R equivalent
 * left_join <- dt[dt2, on = "name"]
 */
const left_join = join(dt, dt2, { on: 'name', nomatch: 0 });

/**
 * Right join
 *
 * @example
 * # R equivalent
 * right_join <- dt2[dt, on = "name"]
 */
const right_join = join(dt2, dt, { on: 'name' });

/**
 * Full join
 *
 * @example
 * # R equivalent
 * full_join <- merge(dt, dt2, by = "name", all = TRUE)
 */
const full_join = merge(dt, dt2, { by: 'name', all: true });

/**
 * Non-equi join
 * This join operation uses a condition instead of equality for joining.
 *
 * @example
 * # R equivalent
 * dt3 <- data.table(
 *   min_age = c(20, 25, 30),
 *   max_age = c(24, 29, 34),
 *   category = c("Young", "Middle", "Senior")
 * )
 * non_equi_join <- dt[dt3, on = .(age >= min_age, age <= max_age), nomatch = 0]
 */
const dt3 = DataTable.fromArrays({
    min_age: [20, 25, 30],
    max_age: [24, 29, 34],
    category: ['Young', 'Middle', 'Senior']
});

const non_equi_join = join(dt, dt3, {
    on: (d) => between(d.age, d.min_age, d.max_age),
    nomatch: 0
});

/**
 * Rolling join
 * This join operation performs a rolling join, which is useful for time-series data.
 *
 * @example
 * # R equivalent
 * dt4 <- data.table(
 *     date = as.Date(c("2023-01-01", "2023-02-01", "2023-03-01")),
 *     value = c(100, 110, 120)
 * )
 * dates <- data.table(
 *     date = seq(as.Date("2023-01-01"), as.Date("2023-03-31"), by = "day")
 * )
 * rolling_join <- dates[dt4, on = "date", roll = TRUE]
 */
const dt4 = DataTable.fromArrays({
    date: ['2023-01-01', '2023-02-01', '2023-03-01'],
    value: [100, 110, 120]
});
const dates = DataTable.fromArrays({
    date: seq('2023-01-01', '2023-03-31', 'day')
});

const rolling_join = join(dates, dt4, { on: 'date', roll: true });

/**
 * Set operations
 * These operations demonstrate various set operations between DataTables.
 */

/**
 * Create a DataTable for set operations
 *
 * @example
 * # R equivalent
 * dt5 <- data.table(
 *     id = 4:6,
 *     name = c("David", "Eve", "Frank"),
 *     age = c(28, 22, 40)
 * )
 */
const dt5 = DataTable.fromArrays({
    id: seq(4, 6),
    name: ['David', 'Eve', 'Frank'],
    age: [28, 22, 40]
});

/**
 * Union of two DataTables
 * This operation combines two DataTables and removes duplicates.
 *
 * @example
 * # R equivalent
 * union_dt <- unique(rbindlist(list(dt, dt5)))
 */
const union_dt = dt.union(dt5);

/**
 * Intersection of two DataTables
 * This operation returns rows that are present in both DataTables.
 *
 * @example
 * # R equivalent
 * intersect_dt <- fintersect(dt, dt5)
 */
const intersect_dt = fintersect(dt, dt5);

/**
 * Set difference of two DataTables
 * This operation returns rows that are in the first DataTable but not in the second.
 *
 * @example
 * # R equivalent
 * setdiff_dt <- fsetdiff(dt, dt5)
 */
const setdiff_dt = fsetdiff(dt, dt5);

/**
 * Melting and casting
 * These operations reshape data from wide to long format and vice versa.
 */

/**
 * Create a wide-format DataTable
 *
 * @example
 * # R equivalent
 * dt_wide <- data.table(
 *     id = 1:3,
 *     x1 = c(1,2,3),
 *     x2 = c(4,5,6),
 *     x3 = c(7,8,9)
 * )
 */
const dt_wide = DataTable.fromArrays({
    id: seq(1, 3),
    x1: [1, 2, 3],
    x2: [4, 5, 6],
    x3: [7, 8, 9]
});

/**
 * Melt operation (wide to long format)
 * This operation reshapes data from wide to long format.
 *
 * @example
 * # R equivalent
 * dt_long <- melt(
 *     dt_wide,
 *     id.vars = "id",
 *     variable.name = "variable",
 *     value.name = "value"
 * )
 */
const dt_long = melt(dt_wide, {
    id: 'id',
    variable: 'variable',
    value: 'value'
});

/**
 * Cast operation (long to wide format)
 * This operation reshapes data from long to wide format.
 *
 * @example
 * # R equivalent
 * dt_wide_again <- dcast(dt_long, id ~ variable, value.var = "value")
 */
// TODO: Implement dcast functionality
// const dt_wide_again = dcast(dt_long, 'id', 'variable', { value: 'value' });

/**
 * Complex reshaping example
 *
 * @example
 * # R equivalent
 * dt_complex <- data.table(
 *     id = rep(1:3, each = 4),
 *     year = rep(c(2020, 2021), 6),
 *     quarter = rep(1:2, 6),
 *     value = rnorm(12)
 * )
 * dt_reshaped <- dcast(dt_complex, id ~ year + quarter, value.var = "value")
 */
// TODO: Implement complex reshaping functionality
// const dt_complex = DataTable.fromArrays({
//     id: rep(seq(1, 3), 4),
//     year: rep([2020, 2021], 6),
//     quarter: rep(seq(1, 2), 6),
//     value: rnorm(12)
// });
// const dt_reshaped = dcast(dt_complex, 'id', ['year', 'quarter'], { value: 'value' });

/**
 * Copying a DataTable
 * This operation creates a deep copy of a DataTable to avoid modifying the original.
 *
 * @example
 * # R equivalent
 * dt_copy <- copy(dt)
 * dt_copy[, age := age + 1]
 */
const dt_copy = dt.copy();
dt_copy.set(null, (d) => ({ age: d.age.map((a) => a + 1) }));
