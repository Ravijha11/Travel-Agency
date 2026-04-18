import Link from "next/link";
import { CarCatalogImageCover } from "@/components/car-catalog-image";
import { currentUser } from "@clerk/nextjs/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { ensureClerkProfile } from "@/lib/clerk/ensure-profile";
import { adminDeleteCarModel, adminUpsertCarModel } from "@/app/actions/car-models";
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

export default async function AdminCarsPage() {
  const user = await currentUser();
  if (!user) {
    return (
      <p className="text-sm text-muted-foreground">
        Sign in required.
      </p>
    );
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

  const { data: cars } = await supabase
    .from("car_models")
    .select("id, label, image_src, aliases, is_active, updated_at")
    .order("label", { ascending: true });

  return (
    <main className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Car catalog</h1>
          <p className="text-sm text-muted-foreground">
            Manage car names, spelling aliases, and photos used across the app.
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
          <CardTitle>Add a car</CardTitle>
          <CardDescription>
            Upload to Storage, paste any public image URL, or use a path under{" "}
            <code className="font-mono">/public</code>. Aliases are comma-separated.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async (formData) => {
              "use server";
              await adminUpsertCarModel(formData);
            }}
            className="grid gap-4 sm:grid-cols-2"
          >
            <div className="space-y-2">
              <Label htmlFor="new-label">Car name (label)</Label>
              <Input id="new-label" name="label" placeholder="e.g. Eeco" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-image-file">Upload photo</Label>
              <Input id="new-image-file" name="image_file" type="file" accept="image/*" />
              <p className="text-xs text-muted-foreground">
                Stored in Supabase Storage bucket <code className="font-mono">car-photos</code> and shown on the feed.
              </p>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="new-image">Or image URL / path</Label>
              <Input
                id="new-image"
                name="image_src"
                placeholder="https://example.com/eeco.jpg or /your-file-in-public.jpg"
              />
              <p className="text-xs text-muted-foreground">
                External URLs work on the feed as-is. Leave empty if you uploaded a photo above.
              </p>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="new-aliases">Aliases (comma separated)</Label>
              <Input
                id="new-aliases"
                name="aliases"
                placeholder="eco, eecco, eeco maruti"
              />
            </div>
            <div className="sm:col-span-2">
              <button className={cn(buttonVariants(), "w-full")} type="submit">
                Save
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">
          Existing cars{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({(cars ?? []).length})
          </span>
        </h2>

        {!cars?.length ? (
          <p className="text-sm text-muted-foreground">
            No cars yet. Add your most common cars (Eeco, Ertiga, Swift Dzire…).
          </p>
        ) : (
          <ul className="grid gap-3">
            {cars.map((c) => (
              <li key={c.id}>
                <Card>
                  <CardHeader className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle className="text-base">{c.label}</CardTitle>
                          {c.is_active ? (
                            <Badge variant="secondary">Active</Badge>
                          ) : (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                        </div>
                        <CardDescription className="break-all">
                          {c.image_src}
                        </CardDescription>
                      </div>
                      <form
                        action={async () => {
                          "use server";
                          await adminDeleteCarModel(c.id);
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
                    <div className="relative h-28 w-full overflow-hidden rounded-lg border bg-muted/30">
                      <CarCatalogImageCover
                        src={c.image_src}
                        alt={c.label}
                        sizes="(max-width: 768px) 92vw, 720px"
                        objectFit="contain"
                      />
                    </div>

                    <div className="rounded-lg border bg-muted/30 p-3">
                      <form
                        action={async (formData) => {
                          "use server";
                          await adminUpsertCarModel(formData);
                        }}
                        className="grid gap-3 sm:grid-cols-2"
                      >
                        <input type="hidden" name="id" value={c.id} />
                        <div className="space-y-1.5">
                          <Label htmlFor={`label-${c.id}`} className="text-xs">
                            Label
                          </Label>
                          <Input id={`label-${c.id}`} name="label" defaultValue={c.label} required />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`imgfile-${c.id}`} className="text-xs">
                            Replace photo (optional)
                          </Label>
                          <Input
                            id={`imgfile-${c.id}`}
                            name="image_file"
                            type="file"
                            accept="image/*"
                          />
                          <p className="text-[11px] text-muted-foreground">
                            Uploading replaces the image URL automatically.
                          </p>
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label htmlFor={`img-${c.id}`} className="text-xs">
                            Image path/URL
                          </Label>
                          <Input
                            id={`img-${c.id}`}
                            name="image_src"
                            defaultValue={c.image_src}
                          />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label htmlFor={`aliases-${c.id}`} className="text-xs">
                            Aliases (comma separated)
                          </Label>
                          <Input
                            id={`aliases-${c.id}`}
                            name="aliases"
                            defaultValue={(c.aliases ?? []).join(", ")}
                            placeholder="dzire, swift drize, swift desire"
                          />
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              name="is_active"
                              value="true"
                              defaultChecked={Boolean(c.is_active)}
                            />
                            Active
                          </label>
                          <button
                            type="submit"
                            className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
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

