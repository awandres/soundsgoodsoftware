import { db } from "@soundsgood/db/client";
import { users, organizations } from "@soundsgood/db/schema";
import { accounts } from "@soundsgood/db/schema";
import * as bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Seeding database...");

  // Hash passwords
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const clientPasswordHash = await bcrypt.hash("client123", 10);

  // Create Vetted Trainers organization
  console.log("Creating organization...");
  await db.insert(organizations).values({
    id: "org_vetted_trainers",
    name: "Vetted Trainers",
    slug: "vetted-trainers",
    status: "active",
  }).onConflictDoNothing();

  // Create admin user
  console.log("Creating admin user...");
  await db.insert(users).values({
    id: "user_admin",
    email: "admin@soundsgoodsoftware.com",
    name: "Admin User",
    role: "admin",
    organizationId: null,
    emailVerified: true,
  }).onConflictDoNothing();

  // Create admin account (for password auth)
  await db.insert(accounts).values({
    id: "acc_admin",
    userId: "user_admin",
    accountId: "admin@soundsgoodsoftware.com",
    providerId: "credential",
    password: adminPasswordHash,
  }).onConflictDoNothing();

  // Create demo client user
  console.log("Creating demo client user...");
  await db.insert(users).values({
    id: "user_demo_client",
    email: "client@vettedtrainers.com",
    name: "Vetted Trainers Team",
    role: "client",
    organizationId: "org_vetted_trainers",
    emailVerified: true,
  }).onConflictDoNothing();

  // Create client account (for password auth)
  await db.insert(accounts).values({
    id: "acc_demo_client",
    userId: "user_demo_client",
    accountId: "client@vettedtrainers.com",
    providerId: "credential",
    password: clientPasswordHash,
  }).onConflictDoNothing();

  console.log("✅ Seeding complete!");
  console.log("\n📝 Login credentials:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Admin:");
  console.log("  Email:    admin@soundsgoodsoftware.com");
  console.log("  Password: admin123");
  console.log("\nDemo Client (Vetted Trainers):");
  console.log("  Email:    client@vettedtrainers.com");
  console.log("  Password: client123");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

seed()
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });

