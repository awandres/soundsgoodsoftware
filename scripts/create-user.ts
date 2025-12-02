import { auth } from "@soundsgood/auth/server";

async function createUser() {
  console.log("Creating test user with Better Auth...");
  
  // This uses Better Auth's internal user creation
  // It will properly hash the password and set up all necessary records
  const result = await auth.api.signUpEmail({
    body: {
      email: "client@vettedtrainers.com",
      password: "client123",
      name: "Vetted Trainers Team",
    },
  });

  console.log("User created:", result);
}

createUser()
  .then(() => {
    console.log("✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

