// Force Node runtime for NextAuth v4
export const runtime = 'nodejs'

import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/src/lib/db"

const handler = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.user.findUnique({ where: { email: credentials.email } })
        if (!user) return null
        const ok = bcrypt.compareSync(credentials.password, user.passwordHash)
        if (!ok) return null
        return { id: user.id, email: user.email, role: user.role } as any
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) { if (user) token.role = (user as any).role || "ADMIN"; return token },
    async session({ session, token }) { (session as any).role = (token as any).role; return session },
  },
})

export { handler as GET, handler as POST }
