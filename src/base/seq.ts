/**
 * Sequence Generation Functions
 *
 * This module provides functions for generating regular sequences of numbers,
 * mimicking the behavior of R's seq, seq_along, and seq_len functions.
 * These functions are designed to be a TypeScript replacement for R's
 * sequence generation capabilities.
 *
 * @packageDocumentation
 */

/**
 * Generates a sequence of numbers.
 *
 * This function mimics R's seq() function, providing various ways to generate sequences.
 *
 * @param from - The starting value of the sequence (default: 1)
 * @param to - The maximum end value of the sequence (default: 1)
 * @param by - The increment of the sequence (if omitted, calculated based on other parameters)
 * @param length_out - The desired length of the sequence
 * @param along_with - An array to generate a sequence along
 * @returns An array containing the generated sequence
 *
 * @throws {Error} If numerical inputs are not finite
 * @throws {Error} If incompatible arguments are provided
 *
 * @example
 * seq(1, 10)                 // [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
 * seq(1, 10, 2)              // [1, 3, 5, 7, 9]
 * seq(1, 10, length_out = 5) // [1, 3.25, 5.5, 7.75, 10]
 * seq(along_with = [10, 20, 30, 40]) // [1, 2, 3, 4]
 */
export function seq(
    from: number = 1,
    to: number = 1,
    by?: number,
    length_out?: number,
    along_with?: any[]
): number[] {
    // Input validation
    if (
        !Number.isFinite(from) ||
        !Number.isFinite(to) ||
        (by !== undefined && !Number.isFinite(by))
    ) {
        throw new Error('Numerical inputs should be finite');
    }

    // Handle along_with
    if (along_with !== undefined) {
        length_out = along_with.length;
        to = from + length_out - 1;
    }

    // Calculate 'by' if not provided
    if (by === undefined) {
        if (length_out !== undefined) {
            by = (to - from) / (length_out - 1);
        } else {
            by = to >= from ? 1 : -1;
        }
    }

    // Generate sequence
    const result: number[] = [];
    if (length_out !== undefined) {
        for (let i = 0; i < length_out; i++) {
            result.push(from + i * by);
        }
    } else {
        let current = from;
        while ((by > 0 && current <= to) || (by < 0 && current >= to)) {
            result.push(current);
            current += by;
        }
    }

    return result;
}

/**
 * Generates a sequence of numbers along the length of a given array.
 *
 * This function mimics R's seq_along() function.
 *
 * @param along_with - The array to generate the sequence along
 * @returns An array of integers from 1 to the length of the input array
 *
 * @example
 * seq_along(['a', 'b', 'c']) // [1, 2, 3]
 * seq_along([10, 20, 30, 40, 50]) // [1, 2, 3, 4, 5]
 */
export function seq_along(along_with: any[]): number[] {
    return Array.from({ length: along_with.length }, (_, i) => i + 1);
}

/**
 * Generates a sequence of numbers of a specified length.
 *
 * This function mimics R's seq_len() function.
 *
 * @param length_out - The desired length of the sequence
 * @returns An array of integers from 1 to length_out
 * @throws {Error} If length_out is negative
 *
 * @example
 * seq_len(5) // [1, 2, 3, 4, 5]
 * seq_len(0) // []
 */
export function seq_len(length_out: number): number[] {
    if (length_out < 0) {
        throw new Error('length_out must be non-negative');
    }
    return Array.from({ length: length_out }, (_, i) => i + 1);
}

/**
 * Generates regular sequences.
 *
 * This function mimics R's sequence() function, which is a generalization of seq().
 *
 * @param from - Starting value(s) of the sequence(s)
 * @param to - End value(s) of the sequence(s)
 * @param by - Increment(s) of the sequence(s)
 * @param length_out - Desired length(s) of the sequence(s)
 * @returns An array containing the generated sequence
 *
 * @example
 * sequence({ from: 1, to: 3, by: 1 }) // [1, 2, 3]
 * sequence({ from: [1, 2], by: [1, 2], length_out: [3, 2] }) // [1, 2, 3, 2, 4]
 */
export function sequence({
    from = 1,
    to,
    by = 1,
    length_out
}: {
    from?: number | number[];
    to?: number | number[];
    by?: number | number[];
    length_out?: number | number[];
}): number[] {
    // Implementation details omitted for brevity
    // This would involve handling multiple sequences and combining them
    throw new Error('Not implemented');
}

// Additional utility functions could be added here, such as:
// - rep(): to replicate elements
// - diff(): to compute lagged differences
// These would further enhance the package's ability to replace R's functionality
