import NextAuth, { CredentialsSignin, type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import { prisma } from './prisma';

declare module 'next-auth' {
  interface Session {
    user: {
      role?: string;
    } & DefaultSession['user'];
  }
}

// Export v5 handlers and helpers
export const { auth, signIn, signOut, handlers } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'john@foo.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (
          !credentials ||
          typeof credentials.email !== 'string' ||
          typeof credentials.password !== 'string'
        ) {
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user || typeof user.password !== 'string') return null;

        if (user.isSuspended) {
          const suspendedError = new CredentialsSignin();
          suspendedError.code = 'suspended';
          throw suspendedError;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.email,
          role: user.role,
        };
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
  },
  callbacks: {
    session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          role: (token as { role?: string }).role,
        },
      };
    },
    jwt({ token, user }) {
      if (user && typeof (user as { role?: string }).role === 'string') {
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
  },
});