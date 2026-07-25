import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import {
  CRM_GOOGLE_PROVIDER,
  isAuthorizedCrmIdentity,
  normalizeCrmEmail,
} from "@/lib/crm-authorization";

const SESSION_MAX_AGE_SECONDS = 12 * 60 * 60;
const secureCookies = process.env.NODE_ENV === "production";

export const authConfig = {
  providers: [
    Google({
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
    }),
  ],
  pages: {
    signIn: "/crm/login",
    error: "/crm/login",
  },
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  jwt: {
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  useSecureCookies: secureCookies,
  cookies: {
    sessionToken: {
      name: secureCookies
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: secureCookies,
      },
    },
  },
  callbacks: {
    async signIn({ account, profile }) {
      return isAuthorizedCrmIdentity({
        provider: account?.provider,
        email:
          profile && typeof profile.email === "string" ? profile.email : null,
        emailVerified:
          profile &&
          "email_verified" in profile &&
          profile.email_verified === true,
      });
    },
    async jwt({ token, account, profile }) {
      if (account) {
        const identity = {
          provider: account.provider,
          email:
            profile && typeof profile.email === "string"
              ? normalizeCrmEmail(profile.email)
              : null,
          emailVerified:
            profile &&
            "email_verified" in profile &&
            profile.email_verified === true,
        };
        token.crmProvider = identity.provider;
        token.crmEmailVerified = identity.emailVerified;
        token.crmAuthorized = isAuthorizedCrmIdentity(identity);
        if (identity.email) token.email = identity.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.crmProvider =
          typeof token.crmProvider === "string"
            ? token.crmProvider
            : undefined;
        session.user.crmEmailVerified = token.crmEmailVerified === true;
        session.user.crmAuthorized = token.crmAuthorized === true;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {
        // Fall through to the private workspace.
      }
      return `${baseUrl}/crm`;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

export { SESSION_MAX_AGE_SECONDS };
