import { cookies } from "next/headers";
import { signOut } from "@/auth";
import { CRM_COOKIE } from "@/lib/crm-auth";

export default function CrmSignOut() {
  return (
    <form
      action={async () => {
        "use server";
        (await cookies()).delete(CRM_COOKIE);
        await signOut({ redirectTo: "/crm/login" });
      }}
    >
      <button className="btn" type="submit">
        Sign out
      </button>
    </form>
  );
}
