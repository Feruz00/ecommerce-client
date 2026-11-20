/**
 * Frontend cart helpers
 * Place this file at: src/utils/cart.js  (or wherever your imports point)
 */

export function formatPrice(value, language = "ru") {
  const n = Number(value || 0);
  const locale = language === "en" ? "en-US" : "ru-RU";
  return `${n.toLocaleString(locale, { maximumFractionDigits: 2 })} TMT`;
}

/** Normalize any cart API response into a plain items array */
export function getCartItems(cartData) {
  if (!cartData) return [];
  if (Array.isArray(cartData)) return cartData;
  if (Array.isArray(cartData.items)) return cartData.items;
  if (Array.isArray(cartData.data?.items)) return cartData.data.items;
  if (Array.isArray(cartData.data?.data?.items))
    return cartData.data.data.items;
  return [];
}

export function getProductName(item, language = "ru") {
  const p = item?.product || item;
  if (!p) return "Товар";

  return (
    p.translations?.[language]?.name ||
    p.translations?.ru?.name ||
    p.translations?.en?.name ||
    p.translations?.tm?.name ||
    p.name ||
    p.sku ||
    "Товар"
  );
}

export function getProductImage(item) {
  return (
    item?.variant?.image ||
    item?.product?.image ||
    item?.product?.primaryImage?.url ||
    item?.product?.images?.[0]?.url ||
    null
  );
}

/**
 * Unit price – prefer the price that was stored for the chosen variant.
 */
export function getItemPrice(item) {
  if (item?.unitPrice != null) return Number(item.unitPrice);
  if (item?.variant?.price != null) return Number(item.variant.price);
  if (item?.product?.price != null) return Number(item.product.price);
  return 0;
}

export function getItemTotal(item) {
  if (item?.lineTotal != null) return Number(item.lineTotal);
  const qty = Number(item?.quantity || 1);
  return getItemPrice(item) * qty;
}

/**
 * Human-readable variant description from selected_attributes or variant data.
 * Example output: "color: Black · size: XL"
 */
export function getVariantDescription(item, language = "ru") {
  const attrs = item?.selected_attributes;
  if (attrs && typeof attrs === "object") {
    const parts = Object.entries(attrs)
      .filter(([key, value]) => {
        return (
          key !== "variant_id" &&
          value !== null &&
          value !== undefined &&
          value !== ""
        );
      })
      .map(([key, value]) => {
        if (typeof value === "object") {
          return (
            value.name ||
            value.label ||
            value.value ||
            value.title ||
            JSON.stringify(value)
          );
        }
        return `${key}: ${value}`;
      });

    if (parts.length) return parts.join(" · ");
  }

  // Fallback: try attributeValues on the variant object
  const entries =
    item?.variant?.attributeValues ||
    item?.variant?.attributes ||
    item?.variant?.options ||
    [];

  if (entries.length) {
    const parts = entries
      .map((entry) => {
        const name =
          entry?.attribute?.translations?.[language]?.name ||
          entry?.attribute?.name ||
          entry?.attribute?.code ||
          entry?.code ||
          "";
        const label =
          entry?.option?.translations?.[language]?.name ||
          entry?.option?.name ||
          entry?.option?.label ||
          entry?.value_text ||
          entry?.value ||
          "";
        if (!label) return null;
        return name ? `${name}: ${label}` : String(label);
      })
      .filter(Boolean);

    if (parts.length) return parts.join(" · ");
  }

  // Last resort – SKU
  if (item?.variant?.sku) return `SKU: ${item.variant.sku}`;
  return "";
}
