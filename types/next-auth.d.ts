import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      crmProvider?: string;
      crmEmailVerified?: boolean;
      crmAuthorized?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    crmProvider?: string;
    crmEmailVerified?: boolean;
    crmAuthorized?: boolean;
  }
}
