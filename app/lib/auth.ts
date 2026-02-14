import NextAuth, { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Apple from "next-auth/providers/apple";

// Filtrer les providers qui ont des credentials valides
const enabledProviders = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET &&
    !process.env.GOOGLE_CLIENT_ID.includes('your-') &&
    !process.env.GOOGLE_CLIENT_SECRET.includes('your-')) {
  enabledProviders.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  );
}

if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET &&
    !process.env.FACEBOOK_CLIENT_ID.includes('your-') &&
    !process.env.FACEBOOK_CLIENT_SECRET.includes('your-')) {
  enabledProviders.push(
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    })
  );
}

if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET &&
    !process.env.APPLE_CLIENT_ID.includes('your-') &&
    !process.env.APPLE_CLIENT_SECRET.includes('your-')) {
  enabledProviders.push(
    Apple({
      clientId: process.env.APPLE_CLIENT_ID,
      clientSecret: process.env.APPLE_CLIENT_SECRET,
    })
  );
}

export const authConfig: NextAuthConfig = {
  providers: enabledProviders,
  pages: {
    signIn: "/landing",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Ici on pourrait vérifier si l'utilisateur existe dans la DB
      // et le créer si nécessaire
      return true;
    },
    async session({ session, token }) {
      // Ajouter des données supplémentaires à la session si nécessaire
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
