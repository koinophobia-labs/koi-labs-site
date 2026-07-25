import type { Session } from "next-auth";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  isAuthorizedCrmSession,
  type CrmSessionIdentity,
} from "@/lib/crm-authorization";
import { CRM_COOKIE, verifyCrmSession } from "@/lib/crm-auth";

type SessionLoader = () => Promise<Session | null>;

function sessionIdentity(session: Session | null): CrmSessionIdentity | null {
  if (!session?.user) return null;
  return {
    provider: session.user.crmProvider,
    email: session.user.email,
    emailVerified: session.user.crmEmailVerified,
    authorized: session.user.crmAuthorized,
  };
}

export async function hasAuthorizedGoogleCrmSession(
  loadSession: SessionLoader = auth,
) {
  try {
    return isAuthorizedCrmSession(sessionIdentity(await loadSession()));
  } catch {
    // During the staged rollout, an Auth.js configuration problem must not
    // lock out the still-supported legacy administrator session.
    return false;
  }
}

export async function hasCrmPageAccess(
  legacyToken?: string,
  loadSession: SessionLoader = auth,
) {
  if (await hasAuthorizedGoogleCrmSession(loadSession)) return true;
  const token =
    legacyToken === undefined
      ? (await cookies()).get(CRM_COOKIE)?.value
      : legacyToken;
  return verifyCrmSession(token);
}

export async function requireCrmPageAccess() {
  if (!(await hasCrmPageAccess())) redirect("/crm/login");
}

export async function isCrmApiAuthorized(
  request: NextRequest,
  loadSession: SessionLoader = auth,
) {
  if (await hasAuthorizedGoogleCrmSession(loadSession)) return true;
  return verifyCrmSession(request.cookies.get(CRM_COOKIE)?.value);
}
