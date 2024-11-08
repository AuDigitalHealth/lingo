type VerhoeffKeys = {
  d: number[][];
  p: number[][];
  j: number[];
};

const Verhoeff: {
  keys: VerhoeffKeys;
  isValid: (num: string) => boolean;
  calculate: (num: string) => number;
} = {
  keys: {
    // Multiplication table
    d: [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
      [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
      [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
      [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
      [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
      [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
      [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
      [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
      [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
    ],
    // Permutation table
    p: [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
      [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
      [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
      [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
      [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
      [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
      [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
    ],
    // Inverse table for validation
    j: [0, 4, 3, 2, 1, 5, 6, 7, 8, 9],
  },

  // Validate a number with Verhoeff checksum
  isValid: function (num: string): boolean {
    let c = 0;
    num
      .replace(/\D+/g, '')
      .split('')
      .reverse()
      .forEach((digit, i) => {
        c = this.keys.d[c][this.keys.p[i % 8][parseInt(digit, 10)]];
      });
    return c === 0;
  },

  // Calculate the Verhoeff check digit
  calculate: function (num: string): number {
    let c = 0;
    num
      .replace(/\D+/g, '')
      .split('')
      .reverse()
      .forEach((digit, i) => {
        c = this.keys.d[c][this.keys.p[(i + 1) % 8][parseInt(digit, 10)]];
      });
    return this.keys.j[c];
  },
};

export default Verhoeff;
