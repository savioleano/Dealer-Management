// Allowed product categories across the app (manual entry + bulk CSV upload).
export const PRODUCT_CATEGORIES = ['POS', 'ECR', 'Accessories'] as const
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]

export function isValidCategory(value: string): value is ProductCategory {
  return (PRODUCT_CATEGORIES as readonly string[]).includes(value)
}

// VAT. All stored product prices (dealerPrice, sellingPrice) are Ex-VAT.
// VAT and inclusive amounts are always derived from these at this rate.
export const VAT_RATE = 0.18

export function vatAmount(exVat: number): number {
  return exVat * VAT_RATE
}

export function withVat(exVat: number): number {
  return exVat * (1 + VAT_RATE)
}
