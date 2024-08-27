/**
 * Repetition Functions
 *
 * This module provides functions for repeating elements of an array or a value,
 * mimicking the behavior of R's rep function. These functions are designed to be
 * a TypeScript replacement for R's repetition capabilities.
 *
 * @packageDocumentation
 */

/**
 * Repeats the elements of x.
 *
 * @param x - The input array or value to repeat
 * @param times - The number of times to repeat each element
 * @param length_out - The desired length of the output
 * @param each - The number of times to repeat each element before moving to the next
 * @returns An array with the repeated elements
 *
 * @example
 * rep([1, 2, 3], { times: 2 }) // [1, 2, 3, 1, 2, 3]
 * rep([1, 2, 3], { each: 2 }) // [1, 1, 2, 2, 3, 3]
 * rep([1, 2, 3], { length_out: 8 }) // [1, 2, 3, 1, 2, 3, 1, 2]
 */
export function rep<T>(
    x: T | T[],
    options: { times?: number; length_out?: number; each?: number } = {}
): T[] {
    const { times, length_out, each } = options;
    const input = Array.isArray(x) ? x : [x];

    if (times !== undefined) {
        return repTimes(input, times);
    } else if (length_out !== undefined) {
        return repLen(input, length_out);
    } else if (each !== undefined) {
        return repEach(input, each);
    } else {
        return input.slice();
    }
}

/**
 * Repeats the elements of x a specified number of times.
 *
 * @param x - The input array to repeat
 * @param times - The number of times to repeat each element
 * @returns An array with the repeated elements
 *
 * @example
 * rep_int([1, 2, 3], 2) // [1, 2, 3, 1, 2, 3]
 */
export function rep_int<T>(x: T[], times: number): T[] {
    return repTimes(x, times);
}

/**
 * Repeats the elements of x to produce a result with the specified length.
 *
 * @param x - The input array to repeat
 * @param length_out - The desired length of the output
 * @returns An array with the repeated elements
 *
 * @example
 * rep_len([1, 2, 3], 8) // [1, 2, 3, 1, 2, 3, 1, 2]
 */
export function rep_len<T>(x: T[], length_out: number): T[] {
    return repLen(x, length_out);
}

// Helper functions

function repTimes<T>(x: T[], times: number): T[] {
    return Array(times).fill(x).flat();
}

function repLen<T>(x: T[], length_out: number): T[] {
    const result: T[] = [];
    for (let i = 0; i < length_out; i++) {
        result.push(x[i % x.length]);
    }
    return result;
}

function repEach<T>(x: T[], each: number): T[] {
    return x.flatMap((elem) => Array(each).fill(elem));
}
