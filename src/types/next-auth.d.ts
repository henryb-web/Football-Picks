import type { DefaultSession } from "next-auth";

// Extend the session/user/JWT shapes with our custom fields.
declare module "next-auth" {
  interface User {
    username?: string | null;
    isAdmin?: boolean;
  }

  interface Session {
    user: {
      id: string;
      username: string | null;
      isAdmin: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string | null;
    isAdmin?: boolean;
  }
}
