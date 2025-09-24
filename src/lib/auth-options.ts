import type { NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

// Augment the session user with id string
type SessionUserWithId = NonNullable<import("next-auth").Session["user"]> & { id?: string };

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.id = String(user.id);
      return token;
    },
    async session({ session, token }) {
      const u = session.user as SessionUserWithId | null;
      if (u && token.id) u.id = String(token.id);
      return session;
    },
  },
};
