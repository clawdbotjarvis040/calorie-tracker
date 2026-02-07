import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ barcode: string }> }
) {
  const { barcode } = await params;
  const clean = (barcode || "").replace(/[^0-9]/g, "");

  if (!clean) {
    return NextResponse.json({ error: "Missing barcode" }, { status: 400 });
  }

  const url = `https://world.openfoodfacts.org/api/v2/product/${clean}.json`;

  const res = await fetch(url, {
    headers: { "User-Agent": "calorie-tracker/1.0" },
    // OFF is fine with caching.
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Open Food Facts lookup failed" },
      { status: 502 }
    );
  }

  const json = await res.json();
  if (!json?.product) {
    return NextResponse.json({ found: false }, { status: 200 });
  }

  const product = json.product;
  const name =
    product.product_name || product.generic_name || product.abbreviated_product_name;

  const nutr = product.nutriments || {};
  const kcalServing = nutr["energy-kcal_serving"] ?? nutr["energy-kcal_value"];
  const kcal100g = nutr["energy-kcal_100g"];

  const calories =
    typeof kcalServing === "number"
      ? Math.round(kcalServing)
      : typeof kcal100g === "number"
        ? Math.round(kcal100g)
        : null;

  return NextResponse.json({
    found: true,
    barcode: clean,
    name: name || null,
    calories,
    calories_basis: typeof kcalServing === "number" ? "serving" : "100g",
    image: product.image_front_small_url || null,
  });
}
