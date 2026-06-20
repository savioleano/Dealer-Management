// Order workflow: statuses, display labels, badge colors, and payment methods.

export const ORDER_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft / Rejected',
  PENDING_REVIEW: 'Pending Review',
  PENDING_PAYMENT_CONFIRMATION: 'Pending Payment Confirmation',
  PENDING_PAYMENT_APPROVAL: 'Pending Payment Approval',
  PREPARING: 'Preparing the Order',
  DISPATCHED: 'Dispatched',
  COMPLETED: 'Order Completed',
}

export const ORDER_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  PENDING_REVIEW: 'bg-amber-100 text-amber-700',
  PENDING_PAYMENT_CONFIRMATION: 'bg-orange-100 text-orange-700',
  PENDING_PAYMENT_APPROVAL: 'bg-yellow-100 text-yellow-800',
  PREPARING: 'bg-blue-100 text-blue-700',
  DISPATCHED: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-green-100 text-green-700',
}

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] ?? status
}

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-red-100 text-red-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  WAIVED: 'bg-gray-100 text-gray-600',
}

export const PAYMENT_METHODS = ['BANK_TRANSFER', 'BANK_DEPOSIT', 'CHEQUE_DEPOSIT'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: 'Bank Transfer',
  BANK_DEPOSIT: 'Bank Deposit',
  CHEQUE_DEPOSIT: 'Cheque Deposit',
}

export function isValidPaymentMethod(v: string): v is PaymentMethod {
  return (PAYMENT_METHODS as readonly string[]).includes(v)
}
