import { db, users } from "@soundsgood/db";

async function listUsers() {
  const allUsers = await db.select().from(users);
  console.log("Users in database:");
  allUsers.forEach((u) =>
    console.log("  -", u.email, "| role:", u.role, "| accountType:", u.accountType)
  );
}

listUsers()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

