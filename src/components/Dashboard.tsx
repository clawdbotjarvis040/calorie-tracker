"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { Html5Qrcode } from "html5-qrcode";
import { addEntry, deleteEntry, signOut, updateEntry } from "@/app/actions";

export type Entry = {
  id: string;
  occurred_on: string;
  name: string;
  calories: number;
  barcode: string | null;
  created_at: string;
};

const GOAL = 2000;

export default function Dashboard({
  date,
  entries,
}: {
  date: string;
  entries: Entry[];
}) {
  const total = useMemo(
    () => entries.reduce((sum, e) => sum + (e.calories ?? 0), 0),
    [entries]
  );
  const remaining = GOAL - total;
  const pct = Math.min(100, Math.round((total / GOAL) * 100));

  const [scanOpen, setScanOpen] = useState(false);
  const scanElId = "qr-reader";
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const [addName, setAddName] = useState("");
  const [addCalories, setAddCalories] = useState<string>("");
  const [addBarcode, setAddBarcode] = useState<string>("");
  const [lookupStatus, setLookupStatus] = useState<string>("");

  useEffect(() => {
    if (!scanOpen) return;

    let cancelled = false;

    async function start() {
      try {
        const html5QrCode = new Html5Qrcode(scanElId);
        scannerRef.current = html5QrCode;

        const cameras = await Html5Qrcode.getCameras();
        const cameraId = cameras?.[0]?.id;
        if (!cameraId) throw new Error("No camera found");

        await html5QrCode.start(
          cameraId,
          { fps: 12, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            if (cancelled) return;
            // Barcodes often appear as numeric strings.
            const clean = decodedText.replace(/[^0-9]/g, "");
            if (clean.length >= 8) {
              setAddBarcode(clean);
              setScanOpen(false);
              await stop();
              await lookupBarcode(clean);
            }
          },
          () => {}
        );
      } catch (e: any) {
        setLookupStatus(e?.message || "Failed to start scanner");
        setScanOpen(false);
      }
    }

    async function stop() {
      const s = scannerRef.current;
      scannerRef.current = null;
      try {
        if (s) {
          await s.stop();
          await s.clear();
        }
      } catch {}
    }

    start();
    return () => {
      cancelled = true;
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanOpen]);

  async function lookupBarcode(barcode: string) {
    setLookupStatus("Looking up…");
    try {
      const res = await fetch(`/api/food/barcode/${barcode}`);
      const data = await res.json();
      if (!data?.found) {
        setLookupStatus("Not found in Open Food Facts.");
        return;
      }
      if (data.name) setAddName(data.name);
      if (typeof data.calories === "number") setAddCalories(String(data.calories));
      setLookupStatus(
        data.calories
          ? `Found: ${data.name || "product"} (${data.calories} kcal/${data.calories_basis})`
          : `Found: ${data.name || "product"} (no calories)`
      );
    } catch (e: any) {
      setLookupStatus(e?.message || "Lookup failed");
    }
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 pb-24">
      <header className="sticky top-0 z-10 -mx-4 bg-slate-950/90 px-4 pb-3 pt-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-300">Daily total</div>
            <div className="text-2xl font-semibold">{total} kcal</div>
          </div>
          <form action={signOut}>
            <button className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm">
              Sign out
            </button>
          </form>
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Goal {GOAL}</span>
            <span>
              {remaining >= 0 ? `${remaining} left` : `${Math.abs(remaining)} over`}
            </span>
          </div>
          <div className="mt-2 h-3 w-full rounded-full bg-slate-800">
            <div
              className="h-3 rounded-full bg-blue-600"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <DatePicker date={date} />
      </header>

      <section className="mt-4">
        <details className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
          <summary className="cursor-pointer select-none text-sm font-medium">
            Add entry
          </summary>
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-1 gap-2">
              <label className="text-xs text-slate-300">Name</label>
              <input
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="Chicken burrito"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-300">Calories</label>
                <input
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2"
                  inputMode="numeric"
                  value={addCalories}
                  onChange={(e) => setAddCalories(e.target.value)}
                  placeholder="450"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300">Barcode (optional)</label>
                <input
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2"
                  inputMode="numeric"
                  value={addBarcode}
                  onChange={(e) => setAddBarcode(e.target.value)}
                  placeholder="0123456789012"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setScanOpen(true)}
                className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
              >
                Scan barcode
              </button>
              <button
                type="button"
                onClick={() => lookupBarcode(addBarcode)}
                className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                disabled={!addBarcode}
              >
                Lookup
              </button>
            </div>

            {lookupStatus ? (
              <p className="text-xs text-slate-400">{lookupStatus}</p>
            ) : null}

            <form
              action={addEntry}
              onSubmit={() => {
                // Let server action run; optimistic reset.
                setTimeout(() => {
                  setAddName("");
                  setAddCalories("");
                  setAddBarcode("");
                  setLookupStatus("");
                }, 50);
              }}
              className="pt-2"
            >
              <input type="hidden" name="occurred_on" value={date} />
              <input type="hidden" name="name" value={addName} />
              <input type="hidden" name="calories" value={addCalories} />
              <input type="hidden" name="barcode" value={addBarcode} />

              <button className="w-full rounded-xl bg-blue-600 px-4 py-2 font-medium">
                Add
              </button>
            </form>

            {scanOpen ? (
              <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-300">Camera</div>
                  <button
                    type="button"
                    onClick={() => setScanOpen(false)}
                    className="text-xs text-slate-300 underline"
                  >
                    Close
                  </button>
                </div>
                <div id={scanElId} className="mt-2 overflow-hidden rounded-lg" />
                <p className="mt-2 text-xs text-slate-500">
                  Tip: If scanning is flaky, try better lighting and fill the code
                  in manually.
                </p>
              </div>
            ) : null}
          </div>
        </details>
      </section>

      <section className="mt-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-200">Entries</h2>
        {entries.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">
            No entries yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {entries.map((e) => (
              <li
                key={e.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{e.name}</div>
                    <div className="text-xs text-slate-400">
                      {e.barcode ? `Barcode: ${e.barcode}` : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">{e.calories}</div>
                    <div className="text-xs text-slate-400">kcal</div>
                  </div>
                </div>

                <details className="mt-3">
                  <summary className="cursor-pointer text-xs text-slate-300">
                    Edit
                  </summary>
                  <EditEntryForm entry={e} date={date} />
                </details>

                <form action={deleteEntry} className="mt-2">
                  <input type="hidden" name="id" value={e.id} />
                  <button className="text-xs text-red-300 underline">Delete</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-3">
        <h2 className="text-sm font-semibold">Nutrition label photo (stub)</h2>
        <p className="mt-1 text-xs text-slate-400">
          Upload a label image; the API route exists but returns a stub response.
        </p>
        <LabelUpload />
      </section>
    </main>
  );
}

function DatePicker({ date }: { date: string }) {
  return (
    <form className="mt-4">
      <label className="text-xs text-slate-300">Date</label>
      <input
        type="date"
        name="date"
        defaultValue={date}
        className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm"
        onChange={(e) => {
          const url = new URL(window.location.href);
          url.searchParams.set("date", e.target.value);
          window.location.href = url.toString();
        }}
      />
      <div className="mt-1 text-xs text-slate-500">
        {format(new Date(date + "T00:00:00"), "EEEE, MMM d")}
      </div>
    </form>
  );
}

function EditEntryForm({ entry, date }: { entry: Entry; date: string }) {
  const [name, setName] = useState(entry.name);
  const [calories, setCalories] = useState(String(entry.calories));
  const [barcode, setBarcode] = useState(entry.barcode || "");

  return (
    <form action={updateEntry} className="mt-2 space-y-2">
      <input type="hidden" name="id" value={entry.id} />
      <input type="hidden" name="occurred_on" value={date} />

      <div className="grid grid-cols-1 gap-1">
        <label className="text-xs text-slate-300">Name</label>
        <input
          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          name="name"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-slate-300">Calories</label>
          <input
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            name="calories"
            inputMode="numeric"
          />
        </div>
        <div>
          <label className="text-xs text-slate-300">Barcode</label>
          <input
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            name="barcode"
            inputMode="numeric"
          />
        </div>
      </div>

      <button className="rounded-xl bg-slate-800 px-3 py-2 text-sm">
        Save
      </button>
    </form>
  );
}

function LabelUpload() {
  const [msg, setMsg] = useState<string>("");
  return (
    <form
      className="mt-2 flex items-center gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const formEl = e.currentTarget;
        const fd = new FormData(formEl);
        setMsg("Uploading…");
        const res = await fetch("/api/label/parse", {
          method: "POST",
          body: fd,
        });
        const data = await res.json();
        setMsg(JSON.stringify(data));
      }}
    >
      <input
        type="file"
        name="image"
        accept="image/*"
        className="block w-full text-xs text-slate-300 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-xs file:text-slate-50"
      />
      <button className="rounded-xl bg-blue-600 px-3 py-2 text-sm">Upload</button>
      {msg ? (
        <div className="mt-2 w-full break-all text-xs text-slate-400">{msg}</div>
      ) : null}
    </form>
  );
}
