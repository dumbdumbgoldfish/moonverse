import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Discord from "next-auth/providers/discord";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import {
  isInlineSessionImage,
  resolveSessionImageUrl,
  userAvatarApiPath,
} from "@/lib/session-image";

function slugifyUsername(base: string): string {
  const cleaned = base
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);
  return cleaned || "reader";
}

async function uniqueUsername(seed: string): Promise<string> {
  const base = slugifyUsername(seed);
  for (let i = 0; i < 20; i++) {
    const candidate = i === 0 ? base : `${base}_${i}`;
    const exists = await db.user.findUnique({ where: { username: candidate } });
    if (!exists) return candidate;
  }
  return `${base}_${Date.now().toString(36)}`;
}

const providers = [
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email or username", type: "text" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const identifier =
        typeof credentials?.email === "string"
          ? credentials.email.toLowerCase().trim()
          : "";
      const password =
        typeof credentials?.password === "string" ? credentials.password : "";

      if (!identifier || !password) return null;

      const user = await db.user.findFirst({
        where: {
          OR: [{ email: identifier }, { username: identifier }],
        },
      });

      if (!user || user.isSuspended || !user.passwordHash) return null;

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          username: user.username,
          image: resolveSessionImageUrl(user.avatarUrl, user.id) ?? undefined,
          role: user.role,
        };
    },
  }),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }) as never
  );
}

if (process.env.AUTH_DISCORD_ID && process.env.AUTH_DISCORD_SECRET) {
  providers.push(
    Discord({
      clientId: process.env.AUTH_DISCORD_ID,
      clientSecret: process.env.AUTH_DISCORD_SECRET,
      allowDangerousEmailAccountLinking: true,
    }) as never
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account || account.provider === "credentials") return true;

      const email =
        user.email?.toLowerCase().trim() ||
        (typeof profile?.email === "string"
          ? profile.email.toLowerCase().trim()
          : "");
      if (!email) return false;

      let dbUser = await db.user.findUnique({ where: { email } });
      if (!dbUser) {
        const username = await uniqueUsername(
          (profile as { preferred_username?: string } | null)
            ?.preferred_username ||
            user.name ||
            email.split("@")[0] ||
            "reader"
        );
        dbUser = await db.user.create({
          data: {
            email,
            username,
            displayName: user.name?.trim() || username,
            avatarUrl: user.image ?? null,
            passwordHash: null,
            emailVerified: new Date(),
            notificationPreference: { create: {} },
          },
        });
      } else if (dbUser.isSuspended) {
        return false;
      } else if (!dbUser.emailVerified) {
        await db.user.update({
          where: { id: dbUser.id },
          data: { emailVerified: new Date() },
        });
      }

      await db.account.upsert({
        where: {
          provider_providerAccountId: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          },
        },
        create: {
          userId: dbUser.id,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          access_token: account.access_token ?? null,
          refresh_token: account.refresh_token ?? null,
          expires_at: account.expires_at ?? null,
          token_type: account.token_type ?? null,
          scope: account.scope ?? null,
          id_token: account.id_token ?? null,
          session_state:
            typeof account.session_state === "string"
              ? account.session_state
              : null,
        },
        update: {
          access_token: account.access_token ?? null,
          refresh_token: account.refresh_token ?? null,
          expires_at: account.expires_at ?? null,
          id_token: account.id_token ?? null,
        },
      });

      user.id = dbUser.id;
      user.username = dbUser.username;
      user.role = dbUser.role;
      user.name = dbUser.displayName;
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user?.id) {
        token.id = user.id;
        token.username = user.username;
        token.name = user.name;
        token.role = user.role;
        if (user.image) {
          token.picture =
            resolveSessionImageUrl(user.image, user.id) ?? undefined;
        }
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: {
            emailVerified: true,
            username: true,
            role: true,
            avatarUrl: true,
            displayName: true,
          },
        });
        if (dbUser) {
          token.username = dbUser.username;
          token.role = dbUser.role;
          token.isEmailVerified = Boolean(dbUser.emailVerified);
          token.name = dbUser.displayName;
          token.picture =
            resolveSessionImageUrl(dbUser.avatarUrl, user.id) ?? undefined;
        }
      }
      if (!token.role) {
        token.role = UserRole.USER;
      }
      if (trigger === "update" && session) {
        if (typeof session.name === "string") {
          token.name = session.name;
        }
        if ("image" in session) {
          const image =
            typeof session.image === "string" ? session.image.trim() : "";
          token.picture = image
            ? resolveSessionImageUrl(image, token.id as string) ?? undefined
            : undefined;
        }
      }
      if (
        token.id &&
        typeof token.picture === "string" &&
        (isInlineSessionImage(token.picture) ||
          token.picture.length > 512 ||
          token.picture === userAvatarApiPath(token.id as string))
      ) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { avatarUrl: true },
        });
        token.picture =
          resolveSessionImageUrl(dbUser?.avatarUrl ?? null, token.id as string) ??
          undefined;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role =
          (token.role as UserRole | undefined) ?? UserRole.USER;
        session.user.isEmailVerified = Boolean(token.isEmailVerified);
        if (token.name) {
          session.user.name = token.name as string;
        }
        session.user.image =
          typeof token.picture === "string" && token.picture
            ? token.picture
            : null;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
});

export function isGoogleAuthEnabled(): boolean {
  return Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
}

export function isDiscordAuthEnabled(): boolean {
  return Boolean(
    process.env.AUTH_DISCORD_ID && process.env.AUTH_DISCORD_SECRET
  );
}
