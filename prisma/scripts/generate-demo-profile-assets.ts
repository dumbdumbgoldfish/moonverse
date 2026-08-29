/**
 * Generates local demo avatar/banner SVG assets under public/demo/.
 *
 * Usage: npm run demo:generate:profile-assets
 */

import {
  countExistingDemoAssets,
  DEMO_AVATAR_COUNT,
  DEMO_BANNER_COUNT,
  ensureDemoProfileAssets,
} from "../lib/demo/demo-profile-assets";

function main() {
  console.log("🎨 Generating demo profile assets…\n");
  const before = countExistingDemoAssets();
  const written = ensureDemoProfileAssets();
  const after = countExistingDemoAssets();

  console.log(`  Avatars: ${before.avatars} → ${after.avatars} (target ${DEMO_AVATAR_COUNT}, wrote ${written.avatars})`);
  console.log(`  Banners: ${before.banners} → ${after.banners} (target ${DEMO_BANNER_COUNT}, wrote ${written.banners})`);
  console.log("\n✅ Demo profile assets ready at public/demo/avatars and public/demo/banners");
}

main();
