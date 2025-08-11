import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/src/lib/db"
import bcrypt from "bcryptjs"

export const { auth, signIn, signOut, handlers } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null
        const user = await prisma.user.findUnique({ where: { email: creds.email } })
        if (!user) return null
        const ok = bcrypt.compareSync(creds.password, user.passwordHash)
        if (!ok) return null
        return { id: user.id, email: user.email, role: user.role }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) { if (user) token.role = (user as any).role || "ADMIN"; return token },
    async session({ session, token }) { (session as any).role = token.role; return session },
  },
})
