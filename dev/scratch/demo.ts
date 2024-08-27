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
    between
} from 'data-table-utils';

/**
 * Object creation from arrays
 * R:
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
 * Column wise selection
 * The j arg can be:
 *  - string[]: by name
 *  - number[]: by index
 *  - boolean[]: must be the same length as the number of columns
 *  - (dt) => boolean[]
 *
 * R: dt[, .(name, age)]  # Select specific columns
 */
dt.query(null, ['name', 'age']);
dt.query(null, [0, 2]);
dt.query(null, [true, false, true, false, false]);
dt.query(null, (d) => {
    const regex = /a/;
    return d.cols.map((c) => regex.test(c));
});

/**
 * Row wise selection
 * i can be:
 *  - number[]: by index
 *  - boolean[]
 *  - (dt) => boolean[]
 *
 * R: dt[age > 25, ]
 */
dt.query([0, 1, 2]);
dt.query(seq(0, 2));
dt.query((d) => gt(d.age, 25));
dt.query((d) => inside(d.age, [26, 30]));

/**
 * Column wise operations
 * DataTable.query does not update a DT, instead returns a new one
 *
 * j can be an object or function that returns an object
 * where keys are cols to update or create
 * - object: { colName: any[] | (dt) => any[] }
 * - (dt) => object
 *
 * R: dt[, .(height = c(170, 180, 175, 182, 168), weight = rnorm(5, 75, 5))]
 */
const dt_hw = dt.query(null, {
    height: [170, 180, 175, 182, 168, 178, 172, 185, 169, 176],
    weight: rnorm(10, 75, 5)
});

/**
 * Update columns by reference
 * DataTable.set updates the DT in place
 *
 * R: dt[, `:=`(height = c(170, 180, 175, 182, 168), weight = rnorm(5, 75, 5))]
 */
dt.set(null, {
    height: [170, 180, 175, 182, 168, 178, 172, 185, 169, 176],
    weight: rnorm(10, 75, 5)
});

// dt[, bmi := weight / (height/100)^2]
dt.set(null, (d) => ({
    bmi: d.weight.map((w, i) => w / Math.pow(d.height[i] / 100, 2))
}));

// dt[, `:=`(
//     bmi = weight / (height/100)^2,
//     salary_category = ifelse(salary > 60000, "High", "Low")
// )]
dt.set(null, (d) => ({
    bmi: d.weight.map((w, i) => w / Math.pow(d.height[i] / 100, 2)),
    salary_category: d.salary.map((s) => (s > 60000 ? 'High' : 'Low'))
}));

// dt[, c("bmi", "salary_category") := NULL]
dt.set(null, {
    bmi: null,
    salary_category: null
});

/**
 * Compute summary statistics
 *
 * R: dt[, .(avg_age = mean(age), total_salary = sum(salary))]
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
 * R: dt[, .(avg_salary = mean(salary)), by = department]
 */
dt.query(null, (d) => ({ avg_salary: mean(d.salary) }), 'department');

// R: dt[, .(avg_salary = mean(salary)), by = .(department, age > 30)]
dt.query(null, (d) => ({ avg_salary: mean(d.salary) }), [
    'department',
    (d) => gt(d.age, 30)
]);

/**
 * Complex grouping
 *
 * R: dt[, .(avg_salary = mean(salary)), by = .(dept = department, senior = age > 30)]
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
 *
 * R: dt[, salary_diff := salary - mean(salary), by = department]
 */
dt.set(
    null,
    (d) => ({ salary_diff: d.salary.map((s) => s - mean(d.salary)) }),
    'department'
);

/**
 * Complex query with grouping, filtering, and computation
 *
 * R: dt[age > 30, .(high_salary = sum(salary > 70000), avg_age = mean(age)), by = department][high_salary > 0]
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
 * R: setkey(dt, name)
 *    dt["Bob"]
 */
dt.setKey('name');
dt.query('Bob');

/**
 * Using both primary and secondary keys
 * R: setindex(dt, age)
 *    dt[.("Bob", 30), on = .(name, age)]
 */
dt.setIndex('age');
dt.query(['Bob', 30], { on: ['name', 'age'] });

/**
 * Automatic indexing
 * R: options(datatable.auto.index = TRUE)
 *    dt[.("Bob", 30), on = .(name, age)]
 */
DataTable.setOption('autoIndex', true);
dt.query(['Bob', 30], { on: ['name', 'age'] });

/**
 * Apply function to subset of columns by group
 * R: dt[, lapply(.SD, mean), by = .(age > 30), .SDcols = c("age", "salary")]
 *
 * grouping by age > 30 then calculating mean of age and salary
 *   age salary
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
 * R: dt[, .N, by = .(age > 30)]
 *
 * grouping by age > 30 then counting number of rows
 *  age N
 * 1:  35 1
 * 2:  40 1
 * 3:  45 1
 */
dt.query(
    null,
    (d) => ({ N: d.id.length }),
    (d) => gt(d.age, 30)
);

/**
 * Find index of maximum value by group
 * R: dt[, .I[which.max(salary)], by = .(age > 30)]
 */
dt.query(
    null,
    (d) => ({ I: d.id[Which.max(d.salary)] }),
    (d) => gt(d.age, 30)
);
// Which is a helper for finding indices of values that satisfy a condition

/**
 * Assign group numbers
 * R: dt[, grp := .GRP, by = .(age > 30)]
 *
 * grouping by age > 30 then assigning group numbers
 *  age salary grp
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
// Which.rleid is a helper for assigning group numbers it takes an array of booleans and returns an array of group numbers of length equal to the input array

/**
 * Access grouping variables
 * R: dt[, .BY, by = .(age > 30)]
 */
dt.query(
    null,
    (d, { BY }) => BY,
    (d) => gt(d.age, 30)
);

// dt[, group := rleid(age > 30)]
dt.set(null, (d) => ({ group: Which.rleid(gt(d.age, 30)) }));

// dt[, prev_salary := shift(salary), by = .(age > 30)]
dt.set(
    null,
    (d) => ({ prev_salary: d.salary.map((s, i) => d.salary[i - 1]) }),
    (d) => gt(d.age, 30)
);

/**
 * Join operations
 *
 * Joins are done using the query method with the on option
 *
 * dt2 <- data.table(
 *  name = c("Alice", "Bob", "Frank", "George"),
 *  department = c("HR", "IT", "Finance", "Marketing"
 * )
 */
const dt2 = DataTable.fromArrays({
    name: ['Alice', 'Bob', 'Frank', 'George'],
    department: ['HR', 'IT', 'Finance', 'Marketing']
});

// inner_join <- join(dt, dt2, on = "name")
const inner_join = join(dt, dt2, { on: 'name' });

// left_join <- dt[dt2, on = "name", nomatch = 0]
const left_join = join(dt, dt2, { on: 'name', nomatch: 0 });

// right_join <- dt2[dt, on = "name"]
const right_join = join(dt2, dt, { on: 'name' });

// full_join <- merge(dt, dt2, by = "name", all = TRUE)
const full_join = merge(dt, dt2, { by: 'name', all: true });

// dt3 <- data.table(
//   min_age = c(20, 25, 30),
//   max_age = c(24, 29, 34),
//   category = c("Young", "Middle", "Senior")
// )
// non_equi_join <- dt[dt3, on = .(age >= min_age, age <= max_age), nomatch = 0]
const dt3 = DataTable.fromArrays({
    min_age: [20, 25, 30],
    max_age: [24, 29, 34],
    category: ['Young', 'Middle', 'Senior']
});

const non_equi_join = join(dt, dt3, {
    on: (d) => between(d.age, d.min_age, d.max_age),
    nomatch: 0
});

// dt4 <- data.table(
//     date = as.Date(c("2023-01-01", "2023-02-01", "2023-03-01")),
//     value = c(100, 110, 120)
// )
// dates <- data.table(
//     date = seq(as.Date("2023-01-01"), as.Date("2023-03-31"),
//     by = "day")
// )
// rolling_join <- dates[dt4, on = "date", roll = TRUE]
const dt4 = DataTable.fromArrays({
    date: ['2023-01-01', '2023-02-01', '2023-03-01'],
    value: [100, 110, 120]
});
const dates = DataTable.fromArrays({
    date: seq('2023-01-01', '2023-03-31', 'day')
});

const rolling_join = join(dates, dt4, { on: 'date', roll: true });

// dt5 <- data.table(
//     id = 4:6,
//     name = c("David", "Eve", "Frank"),
//     age = c(28, 22, 40)
// )
// union_dt <- unique(rbindlist(list(dt, dt5)))
// intersect_dt <- fintersect(dt, dt5)
// setdiff_dt <- fsetdiff(dt, dt5)
const dt5 = DataTable.fromArrays({
    id: seq(4, 6),
    name: ['David', 'Eve', 'Frank'],
    age: [28, 22, 40]
});

const union_dt = dt.union(dt5);
const intersect_dt = fintersect(dt, dt5);
const setdiff_dt = fsetdiff(dt, dt5);

/**
 * Melting and casting
 */

// dt_wide <- data.table(
//     id = 1:3,
//     x1 = c(1,2,3),
//     x2 = c(4,5,6),
//     x3 = c(7,8,9)
// )
// dt_long <- melt(
//     dt_wide, id.vars = "id", variable.name = "variable", value.name = "value"
// )
const dt_wide = DataTable.fromArrays({
    id: seq(1, 3),
    x1: [1, 2, 3],
    x2: [4, 5, 6],
    x3: [7, 8, 9]
});
const dt_long = melt(dt_wide, {
    id: 'id',
    variable: 'variable',
    value: 'value'
});

// dt_wide_again <- dcast(dt_long, id ~ variable, value.var = "value")
// TODO: dcast syntax

// dt_complex <- data.table(
//     id = rep(1:3, each = 4),
//     year = rep(c(2020, 2021), 6),
//     quarter = rep(1:2, 6),
//     value = rnorm(12)
// )
// dt_reshaped <- dcast(dt_complex, id ~ year + quarter, value.var = "value")

/**
 * Copying a DataTable
 *
 * You might want to copy a DataTable to avoid modifying the original
 *
 * R: dt_copy <- copy(dt)
 * dt_copy[, age := age + 1]
 */
const dt_copy = dt.copy();
