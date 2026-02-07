import { createClient } from "@/lib/supabase/server";
import Dashboard, { type Entry } from "@/components/Dashboard";

export const dynamic = "force-dynamic";

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const sp = await searchParams;
  const date = sp?.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : todayISO();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // middleware already redirects when missing, but keep it safe.
  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("food_entries")
    .select("id, occurred_on, name, calories, barcode, created_at")
    .eq("user_id", user.id)
    .eq("occurred_on", date)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="mx-auto max-w-md p-4">
        <div className="rounded-xl border border-red-900 bg-red-950 p-3 text-sm">
          Failed to load entries: {error.message}
        </div>
      </main>
    );
  }

  return <Dashboard date={date} entries={(data || []) as Entry[]} />;
}
