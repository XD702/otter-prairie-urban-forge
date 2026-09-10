import { Link } from "@tanstack/react-router";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export function AccountBar() {
  const { isPending } = useCurrentUserState();

  if (isPending) {
    return (
      <div
        className="h-11 w-36 animate-pulse rounded-full border border-gold/20 bg-felt-raise"
        aria-hidden
      />
    );
  }

  return (
    <>
      <SignedIn>
        <div className="rounded-full border border-gold/30 bg-felt-raise/80 px-3 py-1 text-cream [&_button]:text-gold [&_span]:text-cream">
          <UserButton />
        </div>
      </SignedIn>
      <SignedOut>
        <Link
          to="/login"
          className="inline-flex min-h-11 items-center rounded-full border border-gold/40 px-4 text-sm text-gold hover:border-gold hover:bg-gold/10"
        >
          Sign in
        </Link>
      </SignedOut>
    </>
  );
}
