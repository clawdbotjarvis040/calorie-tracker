"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const entrySchema = z.object({
  id: z.string().uuid().optional(),
  occurred_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  name: z.string().min(1).max(200),
  calories: z.coerce.number().int().min(0).max(100000),
  barcode: z.string().max(64).optional().nullable(),
});

export async function addEntry(formData: FormData): Promise<void> {
  const result = entrySchema.safeParse({
    occurred_on: String(formData.get("occurred_on") ?? ""),
    name: String(formData.get("name") ?? ""),
    calories: formData.get("calories"),
    barcode: formData.get("barcode")
      ? String(formData.get("barcode"))
      : null,
  });

  if (!result.success) {
    // Avoid throwing here: an exception in a Server Action can surface as an
    // application error page (especially on mobile refresh/back).
    console.error("addEntry validation failed", result.error.flatten());
    return;
  }

  const parsed = result.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("addEntry: not signed in");
    return;
  }

  const { error } = await supabase.from("food_entries").insert({
    user_id: user.id,
    occurred_on: parsed.occurred_on,
    name: parsed.name,
    calories: parsed.calories,
    barcode: parsed.barcode,
  });

  if (error) {
    console.error("addEntry insert failed", error);
    return;
  }

  revalidatePath("/");
}

export async function updateEntry(formData: FormData): Promise<void> {
  const result = entrySchema.safeParse({
    id: String(formData.get("id") ?? ""),
    occurred_on: String(formData.get("occurred_on") ?? ""),
    name: String(formData.get("name") ?? ""),
    calories: formData.get("calories"),
    barcode: formData.get("barcode")
      ? String(formData.get("barcode"))
      : null,
  });

  if (!result.success) {
    console.error("updateEntry validation failed", result.error.flatten());
    return;
  }

  const parsed = result.data;

  if (!parsed.id) {
    console.error("updateEntry: missing id");
    return;
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("food_entries")
    .update({
      occurred_on: parsed.occurred_on,
      name: parsed.name,
      calories: parsed.calories,
      barcode: parsed.barcode,
    })
    .eq("id", parsed.id);

  if (error) {
    console.error("updateEntry update failed", error);
    return;
  }

  revalidatePath("/");
}

export async function deleteEntry(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) {
    console.error("deleteEntry: missing id");
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("food_entries").delete().eq("id", id);
  if (error) {
    console.error("deleteEntry delete failed", error);
    return;
  }

  revalidatePath("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/");
}
