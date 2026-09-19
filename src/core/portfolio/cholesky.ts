/**
 * BLACKBOX X — Phase 3.8
 * Cholesky Factorization & Numerical Stabilization Engine
 *
 * Decomposes a symmetric positive-definite covariance matrix Σ into L * L^T.
 * Implements reactive regularization: Tikhonov diagonal jitter is only applied
 * if standard Cholesky decomposition fails on the unadjusted matrix.
 */

import { Asset } from './portfolioTypes';

export interface CholeskyResult {
  L: number[][]; // Lower triangular matrix (3x3)
  stabilizationApplied: boolean;
  stabilizationMagnitude?: number;
}

const ASSET_ORDER: Asset[] = ['GOLD', 'BTC', 'NVDA'];

/**
 * Converts a daily covariance record matrix to a 3x3 array in fixed order [GOLD, BTC, NVDA].
 */
export function covarianceRecordToArray(cov: Record<Asset, Record<Asset, number>>): number[][] {
  const n = ASSET_ORDER.length;
  const matrix: number[][] = [];
  for (let i = 0; i < n; i++) {
    matrix[i] = [];
    for (let j = 0; j < n; j++) {
      matrix[i][j] = cov[ASSET_ORDER[i]][ASSET_ORDER[j]];
    }
  }
  return matrix;
}

/**
 * Attempts unregularized Cholesky decomposition L * L^T = Σ.
 * Returns L if successful, or null if a non-positive pivot (<= epsilon) is encountered.
 */
function tryCholesky(matrix: number[][], epsilon: number = 1e-10): number[][] | null {
  const n = matrix.length;
  const L: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;
      for (let k = 0; k < j; k++) {
        sum += L[i][k] * L[j][k];
      }

      if (i === j) {
        const val = matrix[i][i] - sum;
        if (val < epsilon) {
          return null; // Not positive definite, trigger reactive fallback
        }
        L[i][j] = Math.sqrt(val);
      } else {
        if (L[j][j] === 0) {
          return null;
        }
        L[i][j] = (matrix[i][j] - sum) / L[j][j];
      }
    }
  }

  return L;
}

/**
 * Computes Cholesky factor L for 3x3 covariance matrix.
 * Reactive regularization only engages if unadjusted decomposition fails.
 */
export function computeCholesky(matrix: number[][]): CholeskyResult {
  const n = matrix.length;

  // Step 1: Attempt standard decomposition on original covariance matrix
  const cleanL = tryCholesky(matrix, 1e-10);
  if (cleanL !== null) {
    return {
      L: cleanL,
      stabilizationApplied: false,
    };
  }

  // Step 2: Reactive regularization: apply minimal diagonal jitter lambda * I
  let lambda = 1e-8;
  let maxAttempts = 10;
  let regularizedL: number[][] | null = null;

  while (maxAttempts > 0 && regularizedL === null) {
    const regularizedMatrix: number[][] = matrix.map((row, i) =>
      row.map((val, j) => (i === j ? val + lambda : val))
    );

    regularizedL = tryCholesky(regularizedMatrix, 1e-10);
    if (regularizedL === null) {
      lambda *= 10;
      maxAttempts--;
    }
  }

  if (regularizedL === null) {
    throw new Error('Cholesky decomposition failed even after reactive regularization.');
  }

  return {
    L: regularizedL,
    stabilizationApplied: true,
    stabilizationMagnitude: lambda,
  };
}

/**
 * Multiplies lower triangular matrix L by standard normal vector z: ε = L * z.
 */
export function transformCorrelatedShocks(L: number[][], z: number[]): number[] {
  const n = L.length;
  const epsilon: number[] = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j <= i; j++) {
      sum += L[i][j] * z[j];
    }
    epsilon[i] = sum;
  }
  return epsilon;
}
