import prisma from "@db/client";

async function main() {
  try {

    const existingUser = await prisma.user.findUnique({
      where: { username: "admin" },
    });

    if (existingUser) {
      console.log("   Admin user already exists!");
      console.log(`   Username: ${existingUser.username}`);
      console.log(`   Role: ${existingUser.role}`);
      console.log(`   Active: ${existingUser.isActive}`);
    } else {
      // Create admin user if it doesn't exist
      const user = await prisma.user.create({
        data: {
          username: "admin",
          passwordHash: "admin", // TODO: Hash this properly with bcrypt
          fullName: "Admin",
          role: "ADMIN",
          isActive: true,
          needsPasswordChange: false,
        },
      });
      console.log("✅ Admin user created successfully!");
      console.log(`   Username: ${user.username}`);
      console.log(`   ID: ${user.id}`);
    }
  } catch (error: any) {
    if (error.code === "P2002") {
      console.log("ℹ️  User already exists (unique constraint)");
    } else {
      console.error("❌ Database error:", error.message);
      process.exit(1);
    }
  } finally {
    console.log("Enxt AI");
  }
}

main();