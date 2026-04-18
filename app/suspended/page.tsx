import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ClerkSignOutButton } from "@/components/clerk-sign-out-button";

export default function SuspendedPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Account suspended</CardTitle>
          <CardDescription>
            Your access to Lahar ↔ Gwalior Rides has been restricted. If you
            believe this is a mistake, contact support.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClerkSignOutButton className="w-full" />
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "link" }),
              "mt-2 inline-flex w-full justify-center",
            )}
          >
            Back to home
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
