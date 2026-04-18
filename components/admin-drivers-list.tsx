"use client";

import { useMemo, useState } from "react";
import { AdminDriverRow, type AdminDriver } from "@/components/admin-driver-row";
import { DEFAULT_FEED_PRIORITY } from "@/lib/feed-priority";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SortKey = "name" | "verified" | "updated" | "feed";

export function AdminDriversList({ drivers }: { drivers: AdminDriver[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("name");

  const prepared = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = drivers.filter((d) => {
      if (!q) return true;
      return (
        d.id.toLowerCase().includes(q) ||
        (d.full_name || "").toLowerCase().includes(q) ||
        (d.phone_number || "").toLowerCase().includes(q) ||
        (d.car_model || "").toLowerCase().includes(q) ||
        (d.car_number || "").toLowerCase().includes(q)
      );
    });

    list = [...list].sort((a, b) => {
      if (sort === "feed") {
        const fa = a.feed_priority ?? DEFAULT_FEED_PRIORITY;
        const fb = b.feed_priority ?? DEFAULT_FEED_PRIORITY;
        if (fa !== fb) return fa - fb;
      }
      if (sort === "verified") {
        if (a.is_verified !== b.is_verified) return a.is_verified ? -1 : 1;
      }
      if (sort === "updated") {
        const ta = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const tb = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        if (tb !== ta) return tb - ta;
      }
      return (a.full_name || "").localeCompare(b.full_name || "", "en", {
        sensitivity: "base",
      });
    });

    return list;
  }, [drivers, query, sort]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor="admin-driver-search">Search drivers</Label>
          <Input
            id="admin-driver-search"
            placeholder="Name, phone, car, plate, or Clerk id…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:w-52">
          <Label htmlFor="admin-driver-sort">Sort</Label>
          <select
            id="admin-driver-sort"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            <option value="name">Name A–Z</option>
            <option value="feed">Feed boost (low first)</option>
            <option value="verified">Verified first</option>
            <option value="updated">Recently updated</option>
          </select>
        </div>
      </div>

      {!prepared.length ? (
        <p className="text-sm text-muted-foreground">
          {drivers.length ? "No drivers match your search." : "No drivers yet."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {prepared.map((d) => (
            <li key={d.id}>
              <AdminDriverRow driver={d} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
