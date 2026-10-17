import { normalizeDurationType } from "@/lib/services-catalog";

export interface CartFee {
  id: number;
  title: string;
  valueType: string;
  value: number;
  isRefundable: boolean;
  amount: number;
}

export interface CartItem {
  id?: number;
  serviceId: number;
  serviceTitle?: string;
  image?: string;
  price: number;
  discountedPrice?: number;
  qty: number;
  numberOfMembersRequired?: number;
  averageRating?: number;
  duration?: number;
  durationType?: string;
  maxQuantityAllowed?: number;
}

export interface CartGroup {
  cartId: number;
  providerId: number;
  providerImage?: string;
  providerSlug?: string;
  providerAddress?: string;
  companyName: string;
  isProviderVerified: boolean;
  providerLatitude?: number;
  providerLongitude?: number;
  distance?: number | null;
  totalQuantity: number;
  /** Already tax-inclusive: subTotal = subTotalWithoutTax + taxValue. */
  subTotal: number;
  taxValue?: number;
  overallAmount?: number;
  subTotalWithoutTax?: number;
  visitingCharges?: number;
  atStore?: boolean;
  atDoorstep?: boolean;
  isPayLaterAllowed?: boolean;
  isOnlinePaymentAllowed?: boolean;
  fees?: CartFee[];
  feesTotal?: number;
  items: CartItem[];
}

export interface CartData {
  carts: CartGroup[];
  totalServiceCount: number;
  totalProviderCount: number;
  totalOverallAmount: number;
}

function toNumber(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function toBool(value: unknown): boolean {
  return value === 1 || value === "1" || value === true;
}

function normalizeFee(raw: Record<string, unknown>): CartFee {
  return {
    id: toNumber(raw.id),
    title: String(raw.title ?? ""),
    valueType: String(raw.value_type ?? "fixed"),
    value: toNumber(raw.value),
    isRefundable: toBool(raw.is_refundable),
    amount: toNumber(raw.amount),
  };
}

function normalizeItem(raw: Record<string, unknown>): CartItem {
  return {
    serviceId: toNumber(raw.service_id),
    price: toNumber(raw.price),
    qty: toNumber(raw.qty),
    ...(raw.id !== undefined ? { id: toNumber(raw.id) } : {}),
    ...(raw.service_title ? { serviceTitle: String(raw.service_title) } : {}),
    ...(raw.image_of_the_service ? { image: String(raw.image_of_the_service) } : {}),
    ...(raw.discounted_price !== undefined ? { discountedPrice: toNumber(raw.discounted_price) } : {}),
    ...(raw.number_of_members_required !== undefined
      ? { numberOfMembersRequired: toNumber(raw.number_of_members_required) }
      : {}),
    ...(raw.average_rating !== undefined ? { averageRating: toNumber(raw.average_rating) } : {}),
    ...(raw.duration !== undefined ? { duration: toNumber(raw.duration) } : {}),
    ...(raw.duration_type ? { durationType: normalizeDurationType(String(raw.duration_type)) } : {}),
    ...(raw.max_quantity_allowed !== undefined
      ? { maxQuantityAllowed: toNumber(raw.max_quantity_allowed) }
      : {}),
  };
}

function normalizeGroup(raw: Record<string, unknown>): CartGroup {
  const fees = Array.isArray(raw.fees)
    ? raw.fees.map((fee) => normalizeFee(fee as Record<string, unknown>))
    : undefined;

  return {
    cartId: toNumber(raw.cart_id),
    providerId: toNumber(raw.provider_id),
    companyName: String(raw.company_name ?? ""),
    isProviderVerified: toBool(raw.is_provider_verified),
    totalQuantity: toNumber(raw.total_quantity),
    subTotal: toNumber(raw.sub_total),
    items: Array.isArray(raw.items) ? raw.items.map((item) => normalizeItem(item as Record<string, unknown>)) : [],
    ...(raw.provider_image ? { providerImage: String(raw.provider_image) } : {}),
    ...(raw.provider_slug ? { providerSlug: String(raw.provider_slug) } : {}),
    ...(raw.provider_address ? { providerAddress: String(raw.provider_address) } : {}),
    ...(raw.provider_latitude !== undefined ? { providerLatitude: toNumber(raw.provider_latitude) } : {}),
    ...(raw.provider_longitude !== undefined ? { providerLongitude: toNumber(raw.provider_longitude) } : {}),
    // A non-numeric/empty distance (e.g. "") means the backend never computed
    // it — fall back to null rather than toNumber's 0 default so the
    // checkout page's local haversine calc can still fill it in, instead of
    // permanently locking the banner to a false "0.0 km".
    ...(raw.distance !== undefined
      ? { distance: raw.distance === null || !Number.isFinite(Number(raw.distance)) ? null : Number(raw.distance) }
      : {}),
    ...(raw.tax_value !== undefined ? { taxValue: toNumber(raw.tax_value) } : {}),
    ...(raw.overall_amount !== undefined ? { overallAmount: toNumber(raw.overall_amount) } : {}),
    ...(raw.sub_total_without_tax !== undefined
      ? { subTotalWithoutTax: toNumber(raw.sub_total_without_tax) }
      : {}),
    ...(raw.visiting_charges !== undefined ? { visitingCharges: toNumber(raw.visiting_charges) } : {}),
    ...(raw.at_store !== undefined ? { atStore: toBool(raw.at_store) } : {}),
    ...(raw.at_doorstep !== undefined ? { atDoorstep: toBool(raw.at_doorstep) } : {}),
    ...(raw.is_pay_later_allowed !== undefined ? { isPayLaterAllowed: toBool(raw.is_pay_later_allowed) } : {}),
    ...(raw.is_online_payment_allowed !== undefined
      ? { isOnlinePaymentAllowed: toBool(raw.is_online_payment_allowed) }
      : {}),
    ...(fees ? { fees, feesTotal: raw.fees_total !== undefined ? toNumber(raw.fees_total) : fees.reduce((sum, fee) => sum + fee.amount, 0) } : {}),
  };
}

/**
 * manage_cart_new responses carry `carts` directly under `data`; get_cart_new
 * and remove_from_cart_new wrap it under `data.cart_data` instead (both also
 * ship a `reorder_data` sibling). Accept either shape so every cart mutation
 * can feed the same redux slice.
 */
export function normalizeCartResponse(raw: unknown): CartData | null {
  if (!raw) return null;

  // remove_from_cart ships its patch as a bare array of cart groups, with no
  // `carts` wrapper key and no total_service_count/total_provider_count/
  // total_overall_amount summary — treat the array itself as `carts` and
  // derive the summary the same way mergeCartData recomputes it.
  if (Array.isArray(raw)) {
    const carts = raw.map((group) => normalizeGroup(group as Record<string, unknown>));
    return {
      carts,
      totalServiceCount: carts.reduce((sum, group) => sum + group.totalQuantity, 0),
      totalProviderCount: carts.length,
      totalOverallAmount: carts.reduce((sum, group) => sum + (group.overallAmount ?? group.subTotal), 0),
    };
  }

  if (typeof raw !== "object") return null;
  const container = raw as Record<string, unknown>;
  const source =
    "cart_data" in container
      ? (container.cart_data as Record<string, unknown> | null)
      : container;

  if (!source || !Array.isArray(source.carts)) return null;

  return {
    carts: source.carts.map((group) => normalizeGroup(group as Record<string, unknown>)),
    totalServiceCount: toNumber(source.total_service_count),
    totalProviderCount: toNumber(source.total_provider_count),
    totalOverallAmount: toNumber(source.total_overall_amount),
  };
}

/**
 * manage_cart/remove_from_cart responses only carry the fields relevant to
 * that mutation: often just the one provider's group that was touched (not
 * every provider in the cart), and usually without the top-level
 * total_service_count/total_provider_count/total_overall_amount summary at
 * all — see 1.8 vs 1.9 in the API notes. Blindly spreading `...patch` over
 * the previous state used to (a) drop every OTHER provider's cart group
 * that the patch didn't mention, and (b) reset the summary totals to 0,
 * which is exactly what made things like CartMiniBar's `totalServiceCount
 * > 0` check go false right after adding a service from a card — the cart
 * genuinely had items, the merged total just didn't. Fixed by carrying
 * over untouched groups and recomputing the summary from the merged carts
 * instead of trusting whatever the partial response happened to report.
 */
export function mergeCartData(previous: CartData | null, patch: CartData | null): CartData | null {
  if (!patch) return null;

  const previousGroups = new Map(previous?.carts.map((group) => [group.cartId, group]) ?? []);
  const patchGroupIds = new Set(patch.carts.map((group) => group.cartId));

  const mergedPatchGroups = patch.carts.map((group) => {
    const previousGroup = previousGroups.get(group.cartId);
    const previousItems = new Map(previousGroup?.items.map((item) => [item.serviceId, item]) ?? []);
    return {
      ...previousGroup,
      ...group,
      items: group.items.map((item) => ({
        ...previousItems.get(item.serviceId),
        ...item,
      })),
    };
  });

  const untouchedPreviousGroups = (previous?.carts ?? []).filter(
    (group) => !patchGroupIds.has(group.cartId)
  );

  const carts = [...mergedPatchGroups, ...untouchedPreviousGroups].filter(
    (group) => group.totalQuantity > 0
  );

  return {
    carts,
    totalServiceCount: carts.reduce((sum, group) => sum + group.totalQuantity, 0),
    totalProviderCount: carts.length,
    totalOverallAmount: carts.reduce((sum, group) => sum + (group.overallAmount ?? group.subTotal), 0),
  };
}

/**
 * reorder_data's item list ships under `data`, each entry shaped like an
 * order line (id/order_id/service_id/qty/price/discounted_price) with the
 * display fields (title/image/duration/max qty) nested one level deeper in
 * `servic_details` instead of flat like a real cart item — flatten that out
 * so normalizeItem's field mapping can apply unchanged.
 */
function flattenReorderItem(raw: Record<string, unknown>): Record<string, unknown> {
  const details = (raw.servic_details ?? {}) as Record<string, unknown>;
  return {
    id: raw.id,
    service_id: raw.service_id,
    qty: raw.qty,
    price: raw.price ?? details.price,
    discounted_price: raw.discounted_price ?? details.discounted_price,
    service_title: details.translated_title ?? details.title,
    image_of_the_service: details.image_of_the_service,
    duration: details.duration,
    duration_type: details.duration_type,
    number_of_members_required: details.number_of_members_required,
    max_quantity_allowed: details.max_quantity_allowed,
  };
}

/**
 * get_cart's `reorder_data` (requested via `order_id`) is shaped like a
 * single cart group, minus a real `cart_id` — reuse the same field mapping
 * as a normal cart group, keyed by the order id instead so checkout-draft
 * caching and the switch-provider count still have something stable to key
 * off of.
 */
export function normalizeReorderGroup(raw: Record<string, unknown>, orderId: number): CartGroup {
  const rawItems = Array.isArray(raw.items) ? raw.items : Array.isArray(raw.data) ? raw.data : [];
  const items = rawItems.map((item) => flattenReorderItem(item as Record<string, unknown>));
  return { ...normalizeGroup({ ...raw, items }), cartId: orderId };
}

export function findCartItem(data: CartData | null, serviceId: number): CartItem | undefined {
  for (const group of data?.carts ?? []) {
    const item = group.items.find((entry) => entry.serviceId === serviceId);
    if (item) return item;
  }
  return undefined;
}
