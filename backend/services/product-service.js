/* ============================================================
   DisNotify — services/product-service.js
   Assembles the Product JSON the frontend expects. Routes should
   contain NO SQL for products — it all lives here so /deals,
   /products/:id and /watchlist can never drift apart
   
   ============================================================ */

import { query } from '../db/client.js';

export function toProductDTO(row) {
   const offers = Array.isArray(row.offers)  ? row.offers.map((offer) => ({
      retailerId: offer.retailerId,
      retailer: offer.retailerId,
      retailer: offer.retailer,
      Color: offer.retailer,
      price: Number(offer.price),
      shipping: Number(offer.shipping ?? 0),
      currency: offer.currency || "ZAR",
      inStock: Boolean(offer.inStock),
      condition: offer.condition,
      url: offer.url,
      lastChecked: offer.lastChecked,
      ...(Array.isArray(offer.history) ? { history: offer.history.map((point) => ({
         date: point.date,
         price: Number(point.price),
      })),
   } : {}),
})) : [];

offers.sort((a, b) => a.price - b.price);
// best offer is the cheapest in-stock offer, Compare price + shipping and fall back to cheapest out-of-stock if none are in stock

const inStockOffers = offers.filter((offer) => offer.inStock);

const bestOffer = inStockOffers.length > 0 ?
   [...inStockOffers].sort((a, b) => (a.price + a.shipping) - (b.price + b.shipping))[0] :
   [...offers].sort((a, b) => a.price + a.shipping - (b.price + b.shipping))[0] || null;

   // if no offers, bestOffer is null

   if (bestOffer && !inStockOffers.length) {
      bestOffer.inStock = false;
   } // mark as out of stock if no in-stock offers

   const msrp = 
   row.msrp === null || row.msrp === undefined ? null : Number(row.msrp);

   const currentPrice = bestOffer ? Number(bestOffer.price) : null;

   const discountPercent = msrp !== null && msrp > 0 && currentPrice !== null ? Math.max(
      0, Math.round(((msrp - currentPrice)  / msrp) * 100)
   ) : null;

   const dto = {
    id: row.id,
    name: row.name,
    brand: row.brand,
    category: row.category,
    image: row.imageUrl,
    specs: row.specs || {},
    msrp,

    offers,

    bestOffer,

    priceHistory: Array.isArray(row.priceHistory)
      ? row.priceHistory.map((point) => ({
          date: point.date,
          price: Number(point.price),
        }))
      : [],

    lowestEver:
      row.lowestEver === null ||
      row.lowestEver === undefined
        ? null
        : Number(row.lowestEver),

    isLowestEver: Boolean(row.isLowestEver),

    rating:
      row.rating === null || row.rating === undefined
        ? null
        : Number(row.rating),

    reviewCount:
      row.reviewCount === null ||
      row.reviewCount === undefined
        ? 0
        : Number(row.reviewCount),

    updatedAt: row.updatedAt,
  };

  /*
   * API contract:
   * When MSRP is unavailable, do NOT send a fake discount.
   */
  if (discountPercent !== null) {
    dto.discountPercent = discountPercent;
  }

  return dto;
}


/**
 * Keep a history array to <= 90 daily points.
 *
 * The database can contain many observations per day.
 * We first collapse them to one point per day, then downsample
 * if there are still more than 90 days.
 */
function downsampleHistory(history, maxPoints = 90) {
  if (!Array.isArray(history) || history.length === 0) {
    return [];
  }

  // Sort oldest -> newest.
  const sorted = [...history].sort(
    (a, b) =>
      new Date(a.date).getTime() -
      new Date(b.date).getTime()
  );

  if (sorted.length <= maxPoints) {
    return sorted;
  }

  /*
   * Preserve the first and last points and sample evenly
   * between them.
   */
  const result = [];

  for (let i = 0; i < maxPoints; i++) {
    const index = Math.round(
      (i * (sorted.length - 1)) /
        (maxPoints - 1)
    );

    result.push(sorted[index]);
  }

  return result;
}


/**
 * Return products for the deals/list endpoint.
 *
 * filter:
 * {
 *   q,
 *   category,
 *   retailers[],
 *   minDiscount,
 *   maxPrice,
 *   inStockOnly,
 *   sort,
 *   page,
 *   pageSize,
 *   ids[]
 * }
 */
export async function listProducts(filter = {}) {
  const {
    q,
    category,
    retailers = [],
    minDiscount,
    maxPrice,
    inStockOnly = false,
    sort = "newest",
    page = 1,
    pageSize = 20,
    ids = [],
  } = filter;

  const params = [];
  const conditions = [];

  const addParam = (value) => {
    params.push(value);
    return `$${params.length}`;
  };

  /*
   * We calculate the best offer inside SQL so filtering and sorting
   * use the same price/shipping logic as the DTO.
   */
  const bestOfferSQL = `
    SELECT
      o.id,
      o.product_id,
      o.retailer_id,
      o.price,
      o.shipping,
      o.currency,
      o.in_stock,
      o.condition,
      o.url,
      o.last_checked
    FROM offers o
    WHERE o.product_id = p.id
    ORDER BY
      o.in_stock DESC,
      (o.price + o.shipping) ASC NULLS LAST
    LIMIT 1
  `;

  if (q) {
    const value = addParam(`%${q.toLowerCase()}%`);

    conditions.push(`
      (
        LOWER(p.name) LIKE ${value}
        OR LOWER(COALESCE(p.brand, '')) LIKE ${value}
        OR LOWER(COALESCE(p.search_vector, '')) LIKE ${value}
      )
    `);
  }

  if (category) {
    conditions.push(
      `p.category = ${addParam(category)}`
    );
  }

  if (ids.length > 0) {
    conditions.push(
      `p.id = ANY(${addParam(ids)})`
    );
  }

  if (retailers.length > 0) {
    conditions.push(`
      EXISTS (
        SELECT 1
        FROM offers ro
        WHERE ro.product_id = p.id
          AND ro.retailer_id = ANY(${addParam(retailers)})
      )
    `);
  }

  if (inStockOnly) {
    conditions.push(`
      EXISTS (
        SELECT 1
        FROM offers io
        WHERE io.product_id = p.id
          AND io.in_stock = true
      )
    `);
  }

  /*
   * minDiscount only makes sense when MSRP exists.
   */
  if (
    minDiscount !== undefined &&
    minDiscount !== null
  ) {
    conditions.push(`
      p.msrp IS NOT NULL
      AND p.msrp > 0
      AND (
        (
          (p.msrp - bo.price) / p.msrp
        ) * 100
      ) >= ${addParam(Number(minDiscount))}
    `);
  }

  if (
    maxPrice !== undefined &&
    maxPrice !== null
  ) {
    conditions.push(`
      bo.price IS NOT NULL
      AND (bo.price + bo.shipping) <= ${addParam(
        Number(maxPrice)
      )}
    `);
  }

  const whereSQL =
    conditions.length > 0
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

  let orderSQL;

  switch (sort) {
    case "discount":
      orderSQL = `
        discount_percent DESC NULLS LAST,
        total_price ASC
      `;
      break;

    case "price_asc":
      orderSQL = `
        total_price ASC NULLS LAST
      `;
      break;

    case "price_desc":
      orderSQL = `
        total_price DESC NULLS LAST
      `;
      break;

    case "name":
      orderSQL = `
        p.name ASC
      `;
      break;

    case "newest":
    default:
      orderSQL = `
        p.updated_at DESC
      `;
      break;
  }

  const safePage = Math.max(
    1,
    Number(page) || 1
  );

  const safePageSize = Math.min(
    100,
    Math.max(1, Number(pageSize) || 20)
  );

  const offset = (safePage - 1) * safePageSize;

  const offsetParam = addParam(offset);
  const limitParam = addParam(safePageSize);

  const sql = `
    SELECT
      p.id,
      p.name,
      p.brand,
      p.category,
      p.image_url,
      p.msrp,
      p.specs,
      p.updated_at,

      bo.price AS best_price,
      bo.shipping AS best_shipping,
      bo.in_stock AS best_in_stock,

      CASE
        WHEN p.msrp IS NOT NULL
          AND p.msrp > 0
          AND bo.price IS NOT NULL
        THEN ROUND(
          ((p.msrp - bo.price) / p.msrp * 100)::numeric
        )
        ELSE NULL
      END AS discount_percent,

      (
        bo.price + bo.shipping
      ) AS total_price,

      COUNT(*) OVER() AS total

    FROM products p

    LEFT JOIN LATERAL (
      ${bestOfferSQL}
    ) bo ON true

    ${whereSQL}

    ORDER BY ${orderSQL}

    OFFSET ${offsetParam}
    LIMIT ${limitParam}
  `;

  const result = await query(sql, params);

  if (result.rows.length === 0) {
    return {
      items: [],
      total: 0,
    };
  }

  /*
   * Fetch complete offers for the products on this page.
   */
  const productIds = result.rows.map(
    (row) => row.id
  );

  const offersResult = await query(
    `
      SELECT
        o.product_id,
        o.retailer_id,
        r.name AS retailer,
        r.color,
        o.price,
        o.shipping,
        o.currency,
        o.in_stock,
        o.condition,
        o.url,
        o.last_checked
      FROM offers o
      JOIN retailers r
        ON r.id = o.retailer_id
      WHERE o.product_id = ANY($1)
      ORDER BY
        o.product_id,
        o.price ASC NULLS LAST
    `,
    [productIds]
  );

  const offersByProduct = new Map();

  for (const offer of offersResult.rows) {
    if (!offersByProduct.has(offer.product_id)) {
      offersByProduct.set(
        offer.product_id,
        []
      );
    }

    offersByProduct
      .get(offer.product_id)
      .push({
        retailerId: offer.retailer_id,
        retailer: offer.retailer,
        color: offer.color,
        price: Number(offer.price),
        shipping: Number(offer.shipping),
        currency: offer.currency,
        inStock: Boolean(offer.in_stock),
        condition: offer.condition,
        url: offer.url,
        lastChecked: offer.last_checked,
      });
  }

  const items = result.rows.map((row) => {
    const dto = toProductDTO({
      ...row,
      imageUrl: row.image_url,
      offers:
        offersByProduct.get(row.id) || [],
      priceHistory: [],
      lowestEver: null,
      isLowestEver: false,
      rating: null,
      reviewCount: 0,
    });

    return dto;
  });

  return {
    items,
    total: Number(result.rows[0].total),
  };
}


/**
 * Return one complete product including every offer
 * and each offer's price history.
 */
export async function getProduct(id) {
  const productResult = await query(
    `
      SELECT
        p.id,
        p.name,
        p.brand,
        p.category,
        p.image_url,
        p.msrp,
        p.specs,
        p.updated_at
      FROM products p
      WHERE p.id = $1
      LIMIT 1
    `,
    [id]
  );

  if (productResult.rows.length === 0) {
    return null;
  }

  const product = productResult.rows[0];

  const offersResult = await query(
    `
      SELECT
        o.id,
        o.product_id,
        o.retailer_id,
        r.name AS retailer,
        r.color,
        o.price,
        o.shipping,
        o.currency,
        o.in_stock,
        o.condition,
        o.url,
        o.last_checked
      FROM offers o
      JOIN retailers r
        ON r.id = o.retailer_id
      WHERE o.product_id = $1
      ORDER BY o.price ASC NULLS LAST
    `,
    [id]
  );

  /*
   * Get daily history for every retailer.
   *
   * DISTINCT ON gives us the latest recorded observation
   * for each retailer/day.
   */
  const historyResult = await query(
    `
      SELECT
        product_id,
        retailer_id,
        recorded_at::date AS date,
        price
      FROM (
        SELECT DISTINCT ON (
          retailer_id,
          recorded_at::date
        )
          product_id,
          retailer_id,
          recorded_at,
          price
        FROM price_history
        WHERE product_id = $1
          AND recorded_at >= NOW() - INTERVAL '90 days'
        ORDER BY
          retailer_id,
          recorded_at::date,
          recorded_at DESC
      ) daily
      ORDER BY
        retailer_id,
        date ASC
    `,
    [id]
  );

  const historyByRetailer = new Map();

  for (const point of historyResult.rows) {
    if (!historyByRetailer.has(point.retailer_id)) {
      historyByRetailer.set(
        point.retailer_id,
        []
      );
    }

    historyByRetailer
      .get(point.retailer_id)
      .push({
        date: point.date,
        price: Number(point.price),
      });
  }

  const offers = offersResult.rows.map(
    (offer) => ({
      retailerId: offer.retailer_id,
      retailer: offer.retailer,
      color: offer.color,
      price: Number(offer.price),
      shipping: Number(offer.shipping),
      currency: offer.currency,
      inStock: Boolean(offer.in_stock),
      condition: offer.condition,
      url: offer.url,
      lastChecked: offer.last_checked,
      history: downsampleHistory(
        historyByRetailer.get(
          offer.retailer_id
        ) || [],
        90
      ),
    })
  );

  /*
   * Product-level history:
   * cheapest recorded price per day across all retailers.
   */
  const priceHistoryResult = await query(
    `
      SELECT
        recorded_at::date AS date,
        MIN(price) AS price
      FROM price_history
      WHERE product_id = $1
      GROUP BY recorded_at::date
      ORDER BY date ASC
      LIMIT 90
    `,
    [id]
  );

  const priceHistory = priceHistoryResult.rows.map(
    (point) => ({
      date: point.date,
      price: Number(point.price),
    })
  );

  /*
   * Lowest price ever recorded.
   */
  const lowestResult = await query(
    `
      SELECT MIN(price) AS lowest_ever
      FROM price_history
      WHERE product_id = $1
    `,
    [id]
  );

  const lowestEver =
    lowestResult.rows[0]?.lowest_ever != null
      ? Number(lowestResult.rows[0].lowest_ever)
      : null;

  /*
   * Rating/reviewCount aren't present in your current
   * products schema, so don't invent values.
   */
  return toProductDTO({
    ...product,
    imageUrl: product.image_url,
    offers,
    priceHistory: downsampleHistory(
      priceHistory,
      90
    ),
    lowestEver,
    isLowestEver:
      lowestEver !== null &&
      offers.some(
        (offer) =>
          offer.inStock &&
          offer.price === lowestEver
      ),
    rating: null,
    reviewCount: 0,
  });
}

// throw new Error('services/product-service.js is a scaffold.');
