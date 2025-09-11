// src/utils/materialCodeTransformer.ts

export function transformMaterialCode(originalCode: string): string {
  if (!originalCode || typeof originalCode !== 'string') {
    return originalCode
  }

  // Check if code starts with "10" and ends with "1"
  if (originalCode.startsWith('10') && originalCode.endsWith('1') && originalCode.length > 2) {
    // Replace first two characters "10" with "20" and last character "1" with "2"
    const middlePart = originalCode.slice(2, -1) // Get everything between first 2 and last 1 character
    return `20${middlePart}2`
  }

  // Return original code if transformation pattern doesn't match
  return originalCode
}

/**
 * Check if a material code needs transformation
 */
export function shouldTransformMaterialCode(code: string): boolean {
  return code && typeof code === 'string' && code.startsWith('10') && code.endsWith('1') && code.length > 2
}

/**
 * Transform multiple material codes
 */
export function transformMaterialCodes(codes: string[]): string[] {
  return codes.map(transformMaterialCode)
}