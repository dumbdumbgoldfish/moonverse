import { exportRealWorldCatalogFile } from "../lib/novel-catalog";

const payload = exportRealWorldCatalogFile();

console.log(
  `✓ Exported ${payload.novels.length} real-world novels to prisma/data/real-world-catalog.json`
);
