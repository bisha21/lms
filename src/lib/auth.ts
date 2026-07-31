import { createConnection } from '@/database/db';
import User from '@/database/models/user.schema';
import { NextAuthOptions, Session, User as NextAuthUser } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

// Kept out of route.ts: Next.js App Router only allows route files to export
// HTTP-method handlers and a small set of route config options, so an extra
// `authOptions` export there fails the generated route type-check at build time.
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        await createConnection();
        const user = await User.findOne({ email: credentials.email }).select('+password');
        if (!user || !(await user.comparePassword(credentials.password))) {
          return null;
        }
        return {
          id: user._id.toString(),
          name: user.username,
          email: user.email,
          image: user.profileImage,
        };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user }: { user: NextAuthUser }): Promise<boolean> {
      try {
        await createConnection();
        const existingUser = await User.findOne({ email: user.email });

        if (!existingUser) {
          await User.create({
            username: user.name,
            email: user.email,
            profileImage: user.image,
          });
        }
        return true;
      } catch (error) {
        console.log(error);
        return false;
      }
    },
    async jwt({ token }: { token: JWT }) {
      await createConnection();
      const user = await User.findOne({
        email: token.email,
      });
      if (user) {
        token.id = user._id.toString();
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }

      return session;
    },
  },
};
