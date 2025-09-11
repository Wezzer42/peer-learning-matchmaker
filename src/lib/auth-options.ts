import type { NextAuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import type { JWT } from "next-auth/jwt";
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
        async jwt({ token, account, profile, user }): Promise<JWT> {
            if (user?.id) token.id = String(user.id);
            if (account?.provider === "google" && profile) {
                const p = profile as { sub?: string; email?: string | null };
                if (p.sub) token.sub = p.sub;
                if (p.email) token.email = p.email;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                // id: сначала из token.id, иначе из token.sub
                if (!("id" in session.user) || !session.user.id) {
                    if (token.id) session.user.id = String(token.id);
                    else if (token.sub) session.user.id = String(token.sub);
                }
                if (token.email) session.user.email = token.email;
            }
            return session;
        },
    },
};
