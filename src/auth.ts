import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validation";

const providers: Provider[] = [
  Credentials({
    credentials: {
      identifier: { label: "Email or username", type: "text" },
      password: { label: "Password", type: "password" },
    },
    authorize: async (credentials) => {
      const parsed = loginSchema.safeParse(credentials);
      if (!parsed.success) return null;

      const { identifier, password } = parsed.data;
      const user = await db.user.findFirst({
        where: {
          OR: [{ email: identifier.toLowerCase() }, { username: identifier }],
        },
      });
      if (!user?.passwordHash) return null;

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        username: user.username,
        isAdmin: user.isAdmin,
      };
    },
  }),
];

// Google turns on automatically once its credentials are present in the env.
// Until then it stays out of the provider list and the UI shows it disabled.
export const googleConfigured = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);
if (googleConfigured) {
  providers.push(Google);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  // Rolling 180-day sessions: active users effectively never get logged out,
  // and even inactive ones stay signed in across a full season.
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 180 },
  trustHost: true,
  pages: { signIn: "/login" },
  providers,
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as { username?: string | null }).username ?? null;
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        const claims = token as {
          sub?: string;
          id?: unknown;
          username?: unknown;
          isAdmin?: unknown;
        };
        session.user.id =
          (typeof claims.id === "string" ? claims.id : claims.sub) ?? "";
        session.user.username =
          typeof claims.username === "string" ? claims.username : null;
        session.user.isAdmin = claims.isAdmin === true;
      }
      return session;
    },
  },
});
