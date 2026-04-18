"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  adminSetDriverFeedPriority,
  adminSetDriverRestricted,
  adminSetDriverVerified,
  adminUpdateDriverProfile,
} from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Ban } from "lucide-react";
import { VerifiedBadge } from "@/components/verified-badge";
import { DEFAULT_FEED_PRIORITY } from "@/lib/feed-priority";

export type AdminDriver = {
  id: string;
  full_name: string;
  phone_number: string;
  car_model: string;
  car_number: string;
  is_verified: boolean;
  is_restricted: boolean;
  feed_priority: number;
  call_clicks?: number;
  updated_at?: string;
};

export function AdminDriverRow({ driver }: { driver: AdminDriver }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);

  const [full_name, setFullName] = useState(driver.full_name);
  const [phone_number, setPhoneNumber] = useState(driver.phone_number);
  const [car_model, setCarModel] = useState(driver.car_model);
  const [car_number, setCarNumber] = useState(driver.car_number);
  const [feedPriorityInput, setFeedPriorityInput] = useState(
    String(driver.feed_priority ?? DEFAULT_FEED_PRIORITY),
  );

  useEffect(() => {
    setFeedPriorityInput(String(driver.feed_priority ?? DEFAULT_FEED_PRIORITY));
  }, [driver.id, driver.feed_priority]);

  function openEdit() {
    setFullName(driver.full_name);
    setPhoneNumber(driver.phone_number);
    setCarModel(driver.car_model);
    setCarNumber(driver.car_number);
    setMessage(null);
    setEditOpen(true);
  }

  function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      setMessage(null);
      const fd = new FormData();
      fd.set("driver_id", driver.id);
      fd.set("full_name", full_name);
      fd.set("phone_number", phone_number);
      fd.set("car_model", car_model);
      fd.set("car_number", car_number);
      const res = await adminUpdateDriverProfile(fd);
      if (!res.ok) {
        setMessage(res.error ?? "Could not save");
        return;
      }
      setEditOpen(false);
      router.refresh();
    });
  }

  const updatedLabel = driver.updated_at
    ? new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(driver.updated_at))
    : null;

  return (
    <>
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{driver.full_name || "Unnamed driver"}</p>
            {driver.is_verified ? <VerifiedBadge size="sm" /> : null}
            {driver.is_restricted ? (
              <Badge variant="destructive" className="gap-0.5">
                <Ban className="size-3.5" aria-hidden />
                Restricted
              </Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {driver.phone_number || "—"} · {driver.car_model}{" "}
            {driver.car_number ? `· ${driver.car_number}` : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            Feed priority: {driver.feed_priority ?? DEFAULT_FEED_PRIORITY} (lower
            = higher on home feed; default {DEFAULT_FEED_PRIORITY})
          </p>
          <p className="text-xs text-muted-foreground">
            Under {DEFAULT_FEED_PRIORITY} shows a &quot;Sponsored&quot; label on
            the home feed.
          </p>
          <p className="text-xs text-muted-foreground">
            Call clicks: {(driver.call_clicks ?? 0).toLocaleString("en-IN")}
            {updatedLabel ? ` · Profile updated ${updatedLabel}` : null}
          </p>
          <p className="text-xs font-mono text-muted-foreground/80">
            ID: {driver.id}
          </p>
          {message && !editOpen ? (
            <p className="text-sm text-destructive" role="alert">
              {message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 sm:min-w-[200px] sm:items-stretch">
          <div className="space-y-1.5 rounded-md border bg-muted/30 p-2">
            <Label htmlFor={`feed-pri-${driver.id}`} className="text-xs">
              Feed boost (1–9999)
            </Label>
            <div className="flex gap-1">
              <Input
                id={`feed-pri-${driver.id}`}
                inputMode="numeric"
                className="h-9 min-w-0 flex-1 font-mono text-sm"
                value={feedPriorityInput}
                onChange={(e) => setFeedPriorityInput(e.target.value)}
              />
              <Button
                type="button"
                size="sm"
                className="h-9 shrink-0 px-2"
                disabled={pending}
                onClick={() => {
                  startTransition(async () => {
                    setMessage(null);
                    const n = Number(feedPriorityInput);
                    const res = await adminSetDriverFeedPriority(driver.id, n);
                    if (!res.ok) setMessage(res.error ?? "Could not update");
                    else router.refresh();
                  });
                }}
              >
                Set
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {[1, 2, 5, 10, 25, 100].map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  disabled={pending}
                  onClick={() => {
                    setFeedPriorityInput(String(preset));
                    startTransition(async () => {
                      setMessage(null);
                      const res = await adminSetDriverFeedPriority(
                        driver.id,
                        preset,
                      );
                      if (!res.ok) setMessage(res.error ?? "Could not update");
                      else router.refresh();
                    });
                  }}
                >
                  {preset}
                </Button>
              ))}
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={pending}
            onClick={openEdit}
          >
            Edit details
          </Button>
          {driver.is_verified ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  setMessage(null);
                  const res = await adminSetDriverVerified(driver.id, false);
                  if (!res.ok) setMessage(res.error ?? "Could not update");
                  else router.refresh();
                });
              }}
            >
              Remove verification
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              className="bg-gradient-to-br from-[#0084FF] to-[#0066CC] text-white hover:opacity-95"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  setMessage(null);
                  const res = await adminSetDriverVerified(driver.id, true);
                  if (!res.ok) setMessage(res.error ?? "Could not update");
                  else router.refresh();
                });
              }}
            >
              Verify driver
            </Button>
          )}
          {driver.is_restricted ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  setMessage(null);
                  const res = await adminSetDriverRestricted(driver.id, false);
                  if (!res.ok) setMessage(res.error ?? "Could not update");
                  else router.refresh();
                });
              }}
            >
              Lift restriction
            </Button>
          ) : (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  setMessage(null);
                  const res = await adminSetDriverRestricted(driver.id, true);
                  if (!res.ok) setMessage(res.error ?? "Could not update");
                  else router.refresh();
                });
              }}
            >
              Restrict access
            </Button>
          )}
        </div>
      </div>

      {editOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="presentation"
          onClick={() => !pending && setEditOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border bg-card p-4 shadow-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-edit-driver-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="admin-edit-driver-title"
              className="text-lg font-semibold"
            >
              Edit driver
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {driver.full_name || driver.id}
            </p>
            <form onSubmit={saveEdit} className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`edit-name-${driver.id}`}>Name</Label>
                <Input
                  id={`edit-name-${driver.id}`}
                  value={full_name}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  maxLength={120}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`edit-phone-${driver.id}`}>Calling number</Label>
                <Input
                  id={`edit-phone-${driver.id}`}
                  type="tel"
                  value={phone_number}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  maxLength={20}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`edit-car-${driver.id}`}>Car / model</Label>
                <Input
                  id={`edit-car-${driver.id}`}
                  value={car_model}
                  onChange={(e) => setCarModel(e.target.value)}
                  maxLength={80}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`edit-plate-${driver.id}`}>Car number</Label>
                <Input
                  id={`edit-plate-${driver.id}`}
                  value={car_number}
                  onChange={(e) => setCarNumber(e.target.value)}
                  maxLength={40}
                />
              </div>
              {message ? (
                <p className="text-sm text-destructive" role="alert">
                  {message}
                </p>
              ) : null}
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={pending}
                  onClick={() => setEditOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={pending}>
                  {pending ? "Saving…" : "Save"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
