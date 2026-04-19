import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { ensureClerkProfile } from "@/lib/clerk/ensure-profile";
import {
  adminDeleteDriverDirectoryEntry,
  adminUpsertDriverDirectoryEntry,
} from "@/app/actions/driver-directory";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type DriverDirectoryRow = {
  id: string;
  phone_number: string;
  display_name: string;
  car_model: string | null;
  car_number: string | null;
  default_seats: number | null;
  default_price_per_seat: number | null;
  is_active: boolean | null;
  updated_at: string | null;
};

export default async function AdminDriverDirectoryPage() {
  const user = await currentUser();
  if (!user) {
    return <p className="text-sm text-muted-foreground">Sign in required.</p>;
  }

  await ensureClerkProfile({
    userId: user.id,
    email: user.primaryEmailAddress?.emailAddress ?? null,
    firstName: user.firstName,
    lastName: user.lastName,
  });

  const supabase = createAdminClient();
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (adminProfile?.role !== "admin") {
    return <p className="text-sm text-muted-foreground">Admin access required.</p>;
  }

  const { data: rows } = await supabase
    .from("driver_directory")
    .select(
      "id, phone_number, display_name, car_model, car_number, default_seats, default_price_per_seat, is_active, updated_at",
    )
    .order("updated_at", { ascending: false });

  const entries = (rows ?? []) as DriverDirectoryRow[];

  return (
    <main className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Driver directory</h1>
          <p className="text-sm text-muted-foreground">
            Save phone → name/car defaults for Telegram ingestion (used only when
            the driver has not created a profile in the app yet).
          </p>
        </div>
        <Link
          href="/admin"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Back to Admin
        </Link>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Add a driver</CardTitle>
          <CardDescription>
            Phone is stored as 10 digits. Seats default to 4 and price defaults to
            250.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async (formData) => {
              "use server";
              await adminUpsertDriverDirectoryEntry(formData);
            }}
            className="grid gap-4 sm:grid-cols-2"
          >
            <div className="space-y-2">
              <Label htmlFor="new-phone">Phone number</Label>
              <Input
                id="new-phone"
                name="phone_number"
                placeholder="7610281716"
                inputMode="numeric"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-name">Driver name</Label>
              <Input id="new-name" name="display_name" placeholder="Shivam" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-car-model">Car model (optional)</Label>
              <Input id="new-car-model" name="car_model" placeholder="Swift Dzire" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-car-number">Car number (optional)</Label>
              <Input id="new-car-number" name="car_number" placeholder="MP07CZXXXX" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-seats">Default seats</Label>
              <Input
                id="new-seats"
                name="default_seats"
                type="number"
                min={0}
                max={12}
                step={1}
                defaultValue={4}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-price">Default price per seat</Label>
              <Input
                id="new-price"
                name="default_price_per_seat"
                type="number"
                min={0}
                max={100000}
                step={1}
                defaultValue={250}
                required
              />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="is_active" value="true" defaultChecked />
                Active
              </label>
              <button className={cn(buttonVariants(), "ml-auto")} type="submit">
                Save
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">
          Saved drivers{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({entries.length})
          </span>
        </h2>

        {!entries.length ? (
          <p className="text-sm text-muted-foreground">
            No directory entries yet. Add drivers you post often from WhatsApp groups.
          </p>
        ) : (
          <ul className="grid gap-3">
            {entries.map((d) => (
              <li key={d.id}>
                <Card>
                  <CardHeader className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle className="text-base">{d.display_name}</CardTitle>
                          {d.is_active ? (
                            <Badge variant="secondary">Active</Badge>
                          ) : (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                        </div>
                        <CardDescription className="break-all">
                          {d.phone_number}
                          {d.car_model ? ` • ${d.car_model}` : ""}
                          {d.car_number ? ` • ${d.car_number}` : ""}
                          {typeof d.default_seats === "number"
                            ? ` • ${d.default_seats} seats`
                            : ""}
                          {typeof d.default_price_per_seat === "number"
                            ? ` • ₹${d.default_price_per_seat}/seat`
                            : ""}
                        </CardDescription>
                      </div>
                      <form
                        action={async () => {
                          "use server";
                          await adminDeleteDriverDirectoryEntry(d.id);
                        }}
                      >
                        <button
                          type="submit"
                          className={cn(
                            buttonVariants({ variant: "destructive", size: "sm" }),
                          )}
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-lg border bg-muted/30 p-3">
                      <form
                        action={async (formData) => {
                          "use server";
                          await adminUpsertDriverDirectoryEntry(formData);
                        }}
                        className="grid gap-3 sm:grid-cols-2"
                      >
                        <input type="hidden" name="id" value={d.id} />

                        <div className="space-y-1.5">
                          <Label htmlFor={`phone-${d.id}`} className="text-xs">
                            Phone
                          </Label>
                          <Input
                            id={`phone-${d.id}`}
                            name="phone_number"
                            defaultValue={d.phone_number}
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor={`name-${d.id}`} className="text-xs">
                            Name
                          </Label>
                          <Input
                            id={`name-${d.id}`}
                            name="display_name"
                            defaultValue={d.display_name}
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor={`model-${d.id}`} className="text-xs">
                            Car model
                          </Label>
                          <Input
                            id={`model-${d.id}`}
                            name="car_model"
                            defaultValue={d.car_model ?? ""}
                            placeholder="Swift Dzire"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor={`cno-${d.id}`} className="text-xs">
                            Car number
                          </Label>
                          <Input
                            id={`cno-${d.id}`}
                            name="car_number"
                            defaultValue={d.car_number ?? ""}
                            placeholder="MP07CZXXXX"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor={`seats-${d.id}`} className="text-xs">
                            Seats
                          </Label>
                          <Input
                            id={`seats-${d.id}`}
                            name="default_seats"
                            type="number"
                            min={0}
                            max={12}
                            step={1}
                            defaultValue={d.default_seats ?? 4}
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor={`price-${d.id}`} className="text-xs">
                            Price/seat
                          </Label>
                          <Input
                            id={`price-${d.id}`}
                            name="default_price_per_seat"
                            type="number"
                            min={0}
                            max={100000}
                            step={1}
                            defaultValue={d.default_price_per_seat ?? 250}
                            required
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              name="is_active"
                              value="true"
                              defaultChecked={Boolean(d.is_active)}
                            />
                            Active
                          </label>
                          <button
                            type="submit"
                            className={cn(
                              buttonVariants({ variant: "secondary", size: "sm" }),
                            )}
                          >
                            Update
                          </button>
                        </div>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

