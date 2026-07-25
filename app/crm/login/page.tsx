import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { hasCrmPageAccess } from "@/lib/crm-access";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await hasCrmPageAccess()) redirect("/crm");
  const { error } = await searchParams;

  return (
    <main className="section simple-page">
      <p className="kicker kicker-gold">Koinophobia Labs</p>
      <h1>Private founder workspace</h1>
      <div className="panel crm-login">
        <p>Access is limited to approved Koinophobia Labs administrators.</p>
        {error ? (
          <p role="alert">
            Google sign-in could not grant access. Use an approved administrator
            account and try again.
          </p>
        ) : null}
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/crm" });
          }}
        >
          <button className="btn btn-cyan" type="submit">
            Continue with Google
          </button>
        </form>
      </div>
    </main>
  );
}
