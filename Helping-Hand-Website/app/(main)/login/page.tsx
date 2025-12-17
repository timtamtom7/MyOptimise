import GoogleSignInButton from "@/components/auth/google-signin-button";
import CredentialsLoginForm from "@/components/auth/credentials-login-form";
import Link from "next/link";

export default function LoginPage(props: { searchParams?: { type?: string } }) {
  const type = props.searchParams?.type || "individual";
  const next = (props as any).searchParams?.next || (type === "business" ? "/dashboard/business" : "/dashboard");
  const pending = (props as any).searchParams?.pending;
  const error = (props as any).searchParams?.error;
  return (
    <div className="container mx-auto px-4 py-12 max-w-xl">
      <h1 className="text-3xl font-semibold">Sign In</h1>
      <p className="mt-2 text-muted-foreground">
        {type === "business"
          ? "Sign in to access sponsorships and partner tools."
          : "Sign in to manage your volunteering."}
      </p>
      {error && (
        <div className="mt-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700">
          {error === "missing_token"
            ? "Setup required: missing Sanity write token. Sign in with Google or configure SANITY_API_WRITE_TOKEN."
            : "Sign in failed due to server permissions. Try Google or contact support."}
        </div>
      )}
      {pending && (
        <div className="mt-3 rounded-md border bg-muted/40 px-3 py-2 text-sm">
          Your account is pending approval. You’ll receive an email once approved.
        </div>
      )}
      <div className="mt-4">
        <GoogleSignInButton
          callbackUrl={next}
          label="Continue with Google"
        />
      </div>
      <div className="mt-8">
        <h2 className="text-lg font-medium">Or use email and password</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Available for approved accounts. If you don’t have an account,{" "}
          <Link href={`/signup?type=${type}`} className="underline">sign up</Link>.
        </p>
        <div className="mt-4">
          <CredentialsLoginForm callbackUrl={next} />
        </div>
      </div>
    </div>
  );
}
