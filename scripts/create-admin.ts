import { auth } from "@soundsgood/auth/server";

async function createAdmin() {
  console.log("Creating admin user with Better Auth...");
  
  const result = await auth.api.signUpEmail({
    body: {
      email: "admin@soundsgoodsoftware.com",
      password: "admin123",
      name: "Admin User",
    },
  });

  console.log("Admin created:", result);
  
  // Update the user role to admin in the database
  const { db } = await import("@soundsgood/db/client");
  const { users } = await import("@soundsgood/db/schema");
  const { eq } = await import("drizzle-orm");
  
  await db.update(users)
    .set({ role: "admin" })
    .where(eq(users.id, result.user.id));
  
  console.log("✅ Admin user role updated!");
}

createAdmin()
  .then(() => {
    console.log("\n📝 Admin Login:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  Email:    admin@soundsgoodsoftware.com");
    console.log("  Password: admin123");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });


