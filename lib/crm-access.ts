import type { Session } from "next-auth";
import type { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  isAuthorizedCrmSession,
  type CrmSessionIdentity,
} from "@/lib/crm-authorization";

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
    return false;
  }
}

export async function hasCrmPageAccess(
  loadSession: SessionLoader = auth,
) {
  return hasAuthorizedGoogleCrmSession(loadSession);
}

export async function requireCrmPageAccess() {
  if (!(await hasCrmPageAccess())) redirect("/crm/login");
}

export async function isCrmApiAuthorized(
  _request: NextRequest,
  loadSession: SessionLoader = auth,
) {
  return hasAuthorizedGoogleCrmSession(loadSession);
}
