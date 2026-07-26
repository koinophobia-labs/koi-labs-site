import { signOut } from "@/auth";

export default function CrmSignOut() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/crm/login" });
      }}
    >
      <button className="btn" type="submit">
        Sign out
      </button>
    </form>
  );
}
