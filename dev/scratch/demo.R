box::use(data.table[ data.table ])

# Basic data.table creation and manipulation
# Create a sample dataset
dt <- data.table(
    id = 1:5,
    name = c("Alice", "Bob", "Charlie", "David", "Eve"),
    age = c(25, 30, 35, 28, 22),
    salary = c(50000, 60000, 75000, 55000, 45000)
)

# Display the data.table
print(dt)

# Basic subsetting
print(dt[2:4])  # Select rows 2 to 4
print(dt[, .(name, age)])  # Select specific columns

# Filtering
print(dt[age > 25])

# Adding new columns
dt[, height := c(170, 180, 175, 182, 168)]

# Updating existing columns
dt[, salary := salary * 1.1]  # 10% salary increase

# Multiple column operations
dt[, `:=`(
    bmi = weight / (height/100)^2,
    salary_category = ifelse(salary > 60000, "High", "Low")
)]

# Removing columns
dt[, c("bmi", "salary_category") := NULL]

# Aggregations
print(dt[, .(avg_age = mean(age), total_salary = sum(salary))])

# Group by operations
print(dt[, .(avg_salary = mean(salary)), by = .(age > 30)])

# Chaining operations
result <- dt[age > 25, .(name, age, salary)][order(-salary)]
print(result)

# Advanced features

# Keys
setkey(dt, name)
print(dt["Bob"])  # Fast row access by key

# Secondary keys
setindex(dt, age)
print(dt[.("Bob", 30), on = .(name, age)])  # Using both primary and secondary keys

# Auto indexing
options(datatable.auto.index = TRUE)
dt[.("Bob", 30), on = .(name, age)]  # This will automatically create an index if needed

# Special symbols: .SD, .N, .I, .GRP, .BY
dt[, lapply(.SD, mean), by = .(age > 30), .SDcols = c("age", "salary")]
dt[, .N, by = .(age > 30)]
dt[, .I[which.max(salary)], by = .(age > 30)]
dt[, grp := .GRP, by = .(age > 30)]
dt[, .BY, by = .(age > 30)]

# between() and %between%
dt[age %between% c(25, 30)]

# inrange()
dt[inrange(age, 25, 30, incbounds = TRUE)]

# rleid() for run-length encoding
dt[, group := rleid(age > 30)]

# shift() for lagged operations
dt[, prev_salary := shift(salary), by = .(age > 30)]

# Joins

# Create another data.table for joining
dt2 <- data.table(
    name = c("Alice", "Bob", "Frank", "George"),
    department = c("HR", "IT", "Finance", "Marketing")
)

# Inner join
inner_join <- dt[dt2, on = "name"]
print(inner_join)

# Left join
left_join <- dt[dt2, on = "name", nomatch = 0]
print(left_join)

# Right join (implemented as a left join with reversed order)
right_join <- dt2[dt, on = "name"]
print(right_join)

# Full outer join
full_join <- merge(dt, dt2, by = "name", all = TRUE)
print(full_join)

# Non-equi joins
dt3 <- data.table(min_age = c(20, 25, 30), max_age = c(24, 29, 34), category = c("Young", "Middle", "Senior"))
non_equi_join <- dt[dt3, on = .(age >= min_age, age <= max_age), nomatch = 0]
print(non_equi_join)

# Rolling joins
dt4 <- data.table(date = as.Date(c("2023-01-01", "2023-02-01", "2023-03-01")), value = c(100, 110, 120))
dates <- data.table(date = seq(as.Date("2023-01-01"), as.Date("2023-03-31"), by = "day"))
rolling_join <- dates[dt4, on = "date", roll = TRUE]
print(rolling_join)

# Set operations
dt5 <- data.table(id = 4:6, name = c("David", "Eve", "Frank"), age = c(28, 22, 40))
union_dt <- unique(rbindlist(list(dt, dt5)))
intersect_dt <- fintersect(dt, dt5)
setdiff_dt <- fsetdiff(dt, dt5)

# Reshaping data

# Melt (wide to long)
dt_wide <- data.table(id = 1:3, x1 = c(1,2,3), x2 = c(4,5,6), x3 = c(7,8,9))
dt_long <- melt(dt_wide, id.vars = "id", variable.name = "variable", value.name = "value")
print(dt_long)

# Dcast (long to wide)
dt_wide_again <- dcast(dt_long, id ~ variable, value.var = "value")
print(dt_wide_again)

# Advanced reshaping
dt_complex <- data.table(
    id = rep(1:3, each = 4),
    year = rep(c(2020, 2021), 6),
    quarter = rep(1:2, 6),
    value = rnorm(12)
)
dt_reshaped <- dcast(dt_complex, id ~ year + quarter, value.var = "value")
print(dt_reshaped)

# Cross joins (CJ)
cj_result <- CJ(x = 1:3, y = c("A", "B"))
print(cj_result)

# foverlaps for interval joins
dt_intervals <- data.table(start = c(1, 5, 10), end = c(3, 7, 12), value = c("A", "B", "C"))
setkey(dt_intervals, start, end)
query <- data.table(start = c(2, 6), end = c(4, 8))
overlaps <- foverlaps(query, dt_intervals)
print(overlaps)

# Performance optimization

# Use of set()
set(dt, i = 2, j = "salary", value = 65000)

# Use of :=
dt[, new_col := age * 2]

# Avoiding copies
dt_copy <- copy(dt)
dt_copy[, age := age + 1]

# Benchmarking
system.time({
    for (i in 1:1e5) {
        dt[1, sum(salary)]
    }
})

# Efficient grouping
dt[, .(mean_salary = mean(salary)), keyby = .(age > 30)]

# This script demonstrates a wide range of data.table functionalities, including:
# - Basic operations (creation, subsetting, filtering)
# - Column operations (adding, updating, removing)
# - Aggregations and group by operations
# - Keys and indexing
# - Special symbols (.SD, .N, .I, .GRP, .BY)
# - Various types of joins (inner, left, right, full outer, non-equi, rolling)
# - Set operations
# - Reshaping data (melt, dcast)
# - Cross joins and interval joins
# - Performance optimization techniques

# Note: This script covers most of the core functionalities of data.table, but data.table is a very rich package with many more advanced features and use cases. For a complete understanding, refer to the official data.table documentation and vignettes.