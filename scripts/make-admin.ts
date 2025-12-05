import { db, users, eq } from "@soundsgood/db";

async function makeAdmin() {
  const email = process.argv[2];
  
  if (!email) {
    console.error("Usage: pnpm tsx scripts/make-admin.ts <email>");
    process.exit(1);
  }
  
  const [user] = await db
    .update(users)
    .set({ role: "admin" })
    .where(eq(users.email, email))
    .returning();
  
  if (!user) {
    console.error("User not found:", email);
    process.exit(1);
  }
  
  console.log("✅ User updated to admin:", user.email);
}

makeAdmin()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

