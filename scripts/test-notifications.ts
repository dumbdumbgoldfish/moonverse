import { getEnrichedNotificationsByUser } from "@/services/notification.service";
import { db } from "@/lib/db";

async function main() {
  const user = await db.user.findFirst({ select: { id: true, username: true } });
  if (!user) {
    console.error("no user");
    process.exit(1);
  }
  console.log("user", user.username);
  const items = await getEnrichedNotificationsByUser(user.id, 5);
  console.log("ok", items.length);
  if (items[0]) {
    console.log("sample", {
      headline: items[0].headline,
      subline: items[0].subline,
      type: items[0].type,
    });
  }
}

main()
  .catch((error) => {
    console.error("ERR", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
