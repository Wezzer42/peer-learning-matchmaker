import type { NextAuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import Google from "next-auth/providers/google";

let adapter: Adapter | undefined = undefined;
try {
    const { PrismaAdapter } = await import("@next-auth/prisma-adapter");
    const { prisma } = await import("@/lib/prisma");
    adapter = PrismaAdapter(prisma);
} catch {

}

export const authOptions: NextAuthOptions = {
    adapter,
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    session: { strategy: "jwt" },
    secret: process.env.NEXTAUTH_SECRET,

    callbacks: {
        async jwt({ token, account, profile, user }) {
            if (account?.provider === "google") {
                if (profile && "sub" in profile) token.sub = String(profile.sub);
                if (profile && "email" in profile && profile.email) token.email = String(profile.email);
            }
            if (user?.id) token.id = String(user.id);
            return token;
        },
        async session({ session, token }) {
            if (token?.id) (session.user as any).id = String(token.id);
            if (token?.sub && !session.user?.id) (session.user as any).id = String(token.sub);
            if (token?.email) session.user!.email = String(token.email);
            return session;
        },
    },
};