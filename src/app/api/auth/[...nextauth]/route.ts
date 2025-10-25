import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';

// Validate required environment variables
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is required');
}

if (!process.env.NEXTAUTH_URL) {
  throw new Error('NEXTAUTH_URL environment variable is required');
}

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: { email: {}, password: {} },
      async authorize(creds) {
        try {
          if (!creds?.email || !creds?.password) return null;
          
          // Check if database is available
          if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) {
            console.error('Database not configured. Please set DATABASE_URL environment variable.');
            return null;
          }
          
          const user = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.email, creds.email),
          });
          if (!user?.passwordHash) return null;
          const ok = await bcrypt.compare(creds.password, user.passwordHash);
          if (!ok) return null;
          return { id: String(user.id), email: user.email, name: user.email };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/sign-in',
  },
});
export { handler as GET, handler as POST };
