import { createConnection } from '@/database/db';
import User from '@/database/models/user.schema';
import { AuthOptions, Session } from 'next-auth';
import NextAuth from 'next-auth/next';
import GoogleProvider from 'next-auth/providers/google';
export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  secret: process.env.GOOGLE_NEXT_AUTH_SECRET,
  callbacks: {
    async signIn({ user }): Promise<boolean> {
      try {
        createConnection();
        const existingUser = await User.findOne({ email: user.email });
        if (!existingUser) {
          await User.create({
            email: user.email,
            username: user.name,
            profileImage: user.image,
          });
        }
        return true;
      } catch (err) {
        console.log(err);
        return false;
      }
    },
  },
  async session({ session, user }:{session: Session, user:any}){ 
    const data=await User.findById(user.id);
   session.user.role=data.role||"student";
   return session;
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
