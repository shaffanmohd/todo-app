import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import {connectDb} from "@/lib/db";
import {User} from "@/lib/models/User";
import {verifyPassword} from "@/lib/auth-utils";

export const {handlers, auth, signIn, signOut} = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {label: "Email", type: "email"},
        password: {label: "Password", type: "password"},
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        await connectDb();

        const user = await User.findOne({
          email: (credentials.email as string).toLowerCase(),
        });
        if (!user) {
          return null;
        }

        const isValid = await verifyPassword(
          credentials.password as string,
          user.hashedPassword,
        );
        if (!isValid) {
          return null;
        }

        return {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt: async ({token, user}) => {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    session: async ({session, token}) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
