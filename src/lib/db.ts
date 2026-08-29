import { Prisma, PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  /** Bump after `prisma generate` so dev HMR does not reuse a stale client. */
  prismaGen: number | undefined;
};

/**
 * Increment whenever schema fields change and `prisma generate` ran.
 * Stale Turbopack SSR chunks + a cached PrismaClient cause ValidationError on new fields.
 */
const PRISMA_GEN = 16;

type ClientWithDelegates = PrismaClient & {
  moonieTasteProfile?: { findUnique?: unknown };
};

function prismaModelHasField(modelName: string, fieldName: string): boolean {
  const model = Prisma.dmmf.datamodel.models.find((m) => m.name === modelName);
  return Boolean(model?.fields.some((f) => f.name === fieldName));
}

function clientHasMoonieTaste(client: PrismaClient): boolean {
  return (
    typeof (client as ClientWithDelegates).moonieTasteProfile?.findUnique ===
    "function"
  );
}

function createPrismaClient() {
  if (!prismaModelHasField("ReadingLink", "moderationStatus")) {
    throw new Error(
      "Prisma Client is out of date (missing ReadingLink.moderationStatus). Run: npx prisma generate && rm -rf .next"
    );
  }
  if (!prismaModelHasField("User", "onboardingCompletedAt")) {
    throw new Error(
      "Prisma Client is out of date (missing User.onboardingCompletedAt). Run: npx prisma generate && rm -rf .next"
    );
  }
  if (!prismaModelHasField("User", "profileBackgroundUrl")) {
    throw new Error(
      "Prisma Client is out of date (missing User.profileBackgroundUrl). Run: npx prisma migrate deploy && npx prisma generate && rm -rf .next && restart the dev server"
    );
  }

  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

  // Prefer instance check: Turbopack can cache a stale Prisma namespace/DMMF.
  if (!clientHasMoonieTaste(client)) {
    void client.$disconnect();
    throw new Error(
      "Prisma Client is out of date (missing MoonieTasteProfile). Run: npx prisma generate && rm -rf .next && restart the dev server"
    );
  }

  return client;
}

function getPrismaClient() {
  if (process.env.NODE_ENV !== "production") {
    if (globalForPrisma.prisma && globalForPrisma.prismaGen !== PRISMA_GEN) {
      void globalForPrisma.prisma.$disconnect();
      globalForPrisma.prisma = undefined;
    }
    if (globalForPrisma.prisma && !clientHasMoonieTaste(globalForPrisma.prisma)) {
      void globalForPrisma.prisma.$disconnect();
      globalForPrisma.prisma = undefined;
    }
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
    if (process.env.NODE_ENV === "development") {
      globalForPrisma.prismaGen = PRISMA_GEN;
    }
  }

  return globalForPrisma.prisma;
}

/**
 * Lazy proxy so Turbopack/HMR always resolves through getPrismaClient()
 * instead of a module-init singleton that can outlive prisma generate.
 */
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    // Use the real client as receiver so Prisma model getters keep `this`.
    const value = Reflect.get(client as object, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
