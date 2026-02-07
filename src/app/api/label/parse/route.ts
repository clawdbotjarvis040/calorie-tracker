import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // Multipart form-data expected: { image: File }
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "Expected multipart/form-data" },
      { status: 400 }
    );
  }

  const form = await req.formData();
  const file = form.get("image");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing image" }, { status: 400 });
  }

  // STUB: In production you would send this image to OpenAI Vision (or similar)
  // to extract calories/servings from the nutrition label.
  //
  // Example (pseudo):
  // const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  // const result = await client.responses.create({
  //   model: "gpt-4.1-mini",
  //   input: [{ role: "user", content: [
  //     { type: "input_text", text: "Extract calories per serving and serving size" },
  //     { type: "input_image", image_url: `data:${file.type};base64,${base64}` }
  //   ]}]
  // })

  return NextResponse.json({
    ok: true,
    stub: true,
    filename: file.name,
    bytes: file.size,
    message:
      "Stub endpoint. Wire up OpenAI Vision here to parse nutrition labels.",
  });
}
