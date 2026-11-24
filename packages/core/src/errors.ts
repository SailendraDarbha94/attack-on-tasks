/**
 * Short machine-readable codes the API raises, and what people see instead.
 * The API sends the code as `code` in the error body.
 */
export const ERROR_MESSAGES = {
  not_signed_in: 'Please sign in again.',
  not_authorized: 'Your account is not allowed to do this.',
  account_suspended: 'This account has been suspended.',
  account_not_found: 'No account matches that email.',
  email_taken: 'An account with that email already exists. Sign in instead.',
  store_not_found: 'That store could not be found.',
  store_closed: 'The store is closed right now. Please try again later.',
  address_not_found: 'Choose a delivery address first.',
  outside_delivery_area: 'That address is outside this store’s delivery area.',
  invalid_items: 'Your cart is empty.',
  invalid_quantity: 'One of the quantities in your cart is not allowed.',
  item_unavailable: 'Something in your cart has just sold out. Check your cart and try again.',
  below_minimum_order: 'Your cart is below the minimum order for this store.',
  order_not_found: 'That order could not be found.',
  transition_not_allowed: 'This order has moved on. Refresh to see its current status.',
  product_not_found: 'That product could not be found.',
  already_stocked: 'Your store already stocks that product.',
  price_above_mrp: 'The price cannot be more than the MRP printed on the pack.',
} as const;

export type ErrorCode = keyof typeof ERROR_MESSAGES;

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === 'string' && value in ERROR_MESSAGES;
}
