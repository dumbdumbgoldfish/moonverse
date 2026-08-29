import { PrismaClient } from "@prisma/client";
import { enrichCatalogue } from "../lib/catalogue-enrichment";

const db = new PrismaClient();

async function main() {
  await enrichCatalogue(db);
  console.log("Catalogue enrichment complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
