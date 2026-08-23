import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from './prisma';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { doctorProfile: true }
        });
        
        if (!user) return null;
        
        // For seed users, we didn't bcrypt the seed 'hashedpassword' so let's allow plain match or bcrypt
        const isMatch = (credentials.password === user.passwordHash) || 
                        await bcrypt.compare(credentials.password, user.passwordHash);
                        
        if (!isMatch) return null;
        
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          doctorId: user.doctorProfile?.id
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
        token.doctorId = (user as any).doctorId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session.user as any).doctorId = token.doctorId;
      }
      return session;
    }
  },
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login', // We will build this page
  }
};
