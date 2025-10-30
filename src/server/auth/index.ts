import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db, users } from '@/server/db';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
    };
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || 'development-secret-change-in-production',
  debug: process.env.NODE_ENV === 'development',
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          logger.error('Missing credentials');
          return null;
        }

        try {
          const user = await db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email))
            .limit(1);

          if (!user[0]) {
            logger.error('User not found', { email: credentials.email });
            return null;
          }

          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user[0].passwordHash
          );

          if (!isValidPassword) {
            logger.error('Invalid password', { email: credentials.email });
            return null;
          }

          logger.info('Authentication successful', { email: credentials.email });
          return {
            id: user[0].id,
            email: user[0].email,
          };
        } catch (error: any) {
          // Enhanced error logging for database issues
          const isConnectionError = 
            error?.code === 'ECONNREFUSED' || 
            error?.message?.includes('ECONNREFUSED') ||
            error?.message?.includes('Connection refused');
          
          if (isConnectionError) {
            logger.error('❌ DATABASE CONNECTION FAILED - PostgreSQL is not running or DATABASE_URL is incorrect', {
              error: error?.message,
              code: error?.code,
              hint: 'Check if DATABASE_URL is configured in .env and database is accessible'
            });
          } else {
            logger.error('Authentication database error', {
              error: error?.message,
              code: error?.code,
              stack: error?.stack
            });
          }
          
          // Return null to trigger authentication failure
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/sign-in',
  },
};
