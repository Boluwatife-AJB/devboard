import Link from "next/link";
import { AcceptInviteForm } from "@/components/forms/accept-invite-form";

type AcceptInvitePageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function AcceptInvitePage({
  searchParams,
}: AcceptInvitePageProps) {
  const { token } = await searchParams;

  return (
    <div className="flex w-full max-w-md rounded-xs border-2 border-devboard-primary/20 bg-primary/10 px-8 py-10">
      {token ? (
        <AcceptInviteForm token={token} />
      ) : (
        <div className="flex h-full flex-col justify-center">
          <h1 className="mb-px text-3xl font-bold text-foreground">
            Invalid invite link
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This invitation link is missing a token. Ask your admin to resend
            the invite or copy the link again.
          </p>
          <Link
            href="/sign-in"
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xs bg-devboard-primary px-2.5 text-xs font-semibold text-white transition-colors hover:bg-devboard-primary/90"
          >
            Go to sign in
          </Link>
        </div>
      )}
    </div>
  );
}
