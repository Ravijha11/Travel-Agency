import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { BadgeCheck, Sparkles } from "lucide-react";
import { createAdminClient } from "@/utils/supabase/admin";
import { ensureClerkProfile } from "@/lib/clerk/ensure-profile";
import { isDriverProfileIncomplete } from "@/lib/driver-profile-fields";
import { TripPostWizard } from "@/components/trip-post-wizard";
import { DriverTripRow } from "@/components/driver-trip-row";
import { DriverProfileForm } from "@/components/driver-profile-form";
import { DashboardVerificationPoll } from "@/components/dashboard-verification-poll";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getActiveCarModels } from "@/lib/car-models-db";

const VERIFICATION_CALL = "+918823096882";
const VERIFICATION_TEL = "tel:+918823096882";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    return (
      <p className="text-sm text-muted-foreground">
        Sign in required. Use{" "}
        <Link href="/sign-in?redirect_url=/dashboard" className="underline">
          Sign in
        </Link>{" "}
        to manage trips.
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
  const carCatalog = await getActiveCarModels();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, is_verified, is_restricted, role, phone_number, car_model, car_number",
    )
    .eq("id", user.id)
    .maybeSingle();

  const profileIncomplete =
    profile?.role === "driver" &&
    isDriverProfileIncomplete({
      full_name: profile.full_name,
      phone_number: profile.phone_number,
      car_model: profile.car_model,
      car_number: profile.car_number,
    });

  const canPostTrips =
    profile?.role === "driver" &&
    profile.is_verified &&
    !profileIncomplete;

  const pendingVerification =
    profile?.role === "driver" && !profileIncomplete && !profile.is_verified;

  const { data: trips } = await supabase
    .from("trips")
    .select(
      "id, route_direction, origin, destination, departure_time, available_seats, price_per_seat, status",
    )
    .eq("driver_id", user.id)
    .in("status", ["active", "full"])
    .order("departure_time", { ascending: true });

  return (
    <>
      <DashboardVerificationPoll enabled={Boolean(pendingVerification)} />

      <section className="overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-background to-sky-500/10 p-4 shadow-sm dark:from-primary/15 dark:to-sky-500/5">
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Sparkles className="size-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <h2 className="text-lg font-semibold tracking-tight">
              Trip updates / ट्रिप अपडेट
            </h2>
            <p className="text-sm text-muted-foreground">
              English: one place to finish your profile, get verified, post rides to the home feed,
              and manage active listings.
            </p>
            <p className="text-sm text-muted-foreground">
              हिंदी: प्रोफाइल पूरी करें, वेरिफिकेशन के बाद होम फीड पर राइड पोस्ट करें, और सूची
              यहीं से देखें।
            </p>
          </div>
        </div>
      </section>

      {profile?.role === "driver" && profileIncomplete ? (
        <section className="space-y-3 rounded-2xl border border-amber-500/35 bg-amber-500/10 p-4 dark:bg-amber-500/15">
          <div>
            <h2 className="text-base font-semibold">Finish your profile first / पहले प्रोफाइल पूरी करें</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              English: add your name, calling number, and car details once. Riders see this on the home
              feed. You can change it later from Trip updates → Profile.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              हिंदी: नाम, मोबाइल और गाड़ी की जानकारी भरें — राइडर होम पर आपकी कार्ड देखेंगे। बाद में
              प्रोफाइल से बदल सकते हैं।
            </p>
          </div>
          <DriverProfileForm
            variant="onboarding"
            initial={{
              full_name: profile?.full_name ?? "",
              phone_number: profile?.phone_number ?? "",
              car_model: profile?.car_model ?? "",
              car_number: profile?.car_number ?? "",
            }}
            carCatalog={carCatalog}
          />
        </section>
      ) : null}

      {pendingVerification ? (
        <div className="space-y-3 overflow-hidden rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-500/15 via-card to-violet-500/10 p-4 shadow-md dark:from-sky-500/10">
          <div className="flex flex-wrap items-center gap-2">
            <BadgeCheck className="size-5 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden />
            <p className="text-base font-semibold">Waiting for admin verification</p>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              ऑडमिन वेरिफिकेशन
            </span>
          </div>

          <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">English:</span> your details are saved. Our
              team will review your profile to keep the platform safe. After verification you will see a{" "}
              <span className="font-medium text-foreground">blue tick</span> on your profile and you can
              post trips to the home feed. This page checks for updates automatically about every 45
              seconds — you can also refresh anytime.
            </p>
            <p>
              <span className="font-medium text-foreground">हिंदी:</span> आपकी जानकारी सेव है। हमारी
              टीम आपकी प्रोफाइल देखकर प्लेटफॉर्म सुरक्षित रखेगी। वेरिफाई होने के बाद प्रोफाइल पर{" "}
              <span className="font-medium text-foreground">नीला टिक (blue tick)</span> दिखेगा और आप होम
              फीड पर ट्रिप डाल सकेंगे। यह पेज लगभग हर 45 सेकंड में अपने आप रिफ्रेश होता है — आप खुद भी
              रिफ्रेश कर सकते हैं।
            </p>
            <p>
              <span className="font-medium text-foreground">Need it faster? / जल्दी चाहिए?</span> Call{" "}
              <a
                href={VERIFICATION_TEL}
                className="font-semibold text-primary underline underline-offset-2"
              >
                {VERIFICATION_CALL}
              </a>{" "}
              for verification help.
            </p>
          </div>

          <Link
            href="/account"
            className={cn(
              buttonVariants({ variant: "secondary", size: "sm" }),
              "inline-flex",
            )}
          >
            Open profile & settings / प्रोफाइल खोलें
          </Link>
        </div>
      ) : null}

      {canPostTrips ? (
        <section className="space-y-2">
          <h2 className="text-base font-semibold">
            Post a trip / ट्रिप पोस्ट करें
          </h2>
          <p className="text-xs text-muted-foreground">
            English: route → time → seats & price → confirm — then publish to the home feed.
            <br />
            हिंदी: रूट → समय → सीट और किराया → कन्फर्म — फिर होम फीड पर पब्लिश।
          </p>
          <TripPostWizard />
        </section>
      ) : null}

      {profile?.role === "driver" && !profileIncomplete ? (
        <section className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-3 py-2 text-xs text-muted-foreground dark:bg-emerald-500/10">
          <span className="font-medium text-foreground">Tip / सुझाव:</span> use{" "}
          <Link href="/account" className="underline">
            Profile
          </Link>{" "}
          for account email and sign out. Trip times use 12-hour (am/pm) India time. / ईमेल और साइन आउट
          प्रोफाइल से। समय भारत (IST) में 12 घंटे फॉर्मेट।
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Your active listings / आपकी सूची</h2>
        {!trips?.length ? (
          <p className="text-sm text-muted-foreground">
            English: no active trips.{" "}
            {canPostTrips
              ? "Post one above to appear on the home feed."
              : "Complete the steps above to post trips."}
            <br />
            <span className="mt-1 inline-block">
              हिंदी: कोई सक्रिय ट्रिप नहीं।{" "}
              {canPostTrips
                ? "ऊपर से ट्रिप पोस्ट करें।"
                : "ऊपर के स्टेप पूरे करें।"}
            </span>
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {trips.map((t) => (
              <li key={t.id}>
                <DriverTripRow trip={t} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
