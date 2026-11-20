export function formatPrice(value, language = "ru") {
  const locales = {
    en: "en-US",
    tm: "tk-TM",
    ru: "ru-RU",
  };

  return (
    Number(value || 0).toLocaleString(locales[language] || "ru-RU", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }) + " TMT"
  );
}

export function getItemPrice(item) {
  // The cart item's price is the authoritative unit price.
  // The backend should return the selected variant's price here.
  const value =
    item?.price ??
    item?.unit_price ??
    item?.variant?.price ??
    item?.product?.price ??
    0;

  return Number(value) || 0;
}

export function getItemTotal(item) {
  return getItemPrice(item) * Number(item?.quantity || 0);
}

export function getProductName(item, language = "ru") {
  const product = item?.product || {};

  return (
    product?.translations?.[language]?.name ||
    product?.translations?.en?.name ||
    product?.translations?.ru?.name ||
    product?.name ||
    item?.product_name ||
    "Товар"
  );
}

function getAttributeValues(variant) {
  return (
    variant?.attributeValues || variant?.attributes || variant?.options || []
  );
}

function getTranslatedName(value, language = "ru") {
  if (!value) return "";

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return (
    value?.translations?.[language]?.name ||
    value?.translations?.en?.name ||
    value?.translations?.ru?.name ||
    value?.name ||
    value?.label ||
    value?.value ||
    value?.slug ||
    ""
  );
}

export function getVariantDescription(item, language = "ru") {
  const variantAttributes = getAttributeValues(item?.variant);

  if (variantAttributes.length) {
    return variantAttributes
      .map((entry) => {
        const attributeName = getTranslatedName(
          entry?.attribute || entry?.definition,
          language,
        );

        const optionName = getTranslatedName(
          entry?.option || entry?.attributeOption,
          language,
        );

        const value =
          optionName ||
          entry?.value_text ||
          entry?.value ||
          entry?.display ||
          "";

        if (!value) return "";

        return attributeName ? `${attributeName}: ${value}` : value;
      })
      .filter(Boolean)
      .join(", ");
  }

  const selected = item?.selected_attributes;

  if (!selected || typeof selected !== "object" || Array.isArray(selected)) {
    return "";
  }

  return Object.entries(selected)
    .filter(
      ([key, value]) =>
        key !== "variant_id" &&
        value !== null &&
        value !== undefined &&
        value !== "",
    )
    .map(([key, value]) => {
      if (typeof value === "object") {
        value = getTranslatedName(value, language);
      }

      return `${key}: ${value}`;
    })
    .join(", ");
}

export function getProductImage(item) {
  return (
    item?.variant?.imageFile?.url ||
    item?.variant?.image?.url ||
    item?.variant?.image ||
    item?.product?.primaryImage?.url ||
    item?.product?.images?.[0]?.url ||
    item?.product?.image ||
    item?.image ||
    null
  );
}

export function getCartItems(response) {
  return (
    response?.data?.items ||
    response?.data?.cartItems ||
    response?.items ||
    response?.cartItems ||
    []
  );
}
