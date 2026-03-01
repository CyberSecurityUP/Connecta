import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create a test user
  const passwordHash = await bcrypt.hash("Password123", 12);

  const user = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Admin User",
      displayName: "Admin",
      email: "admin@example.com",
      passwordHash,
      emailVerified: new Date(),
      isAdmin: true,
    },
  });

  // Create a test workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: "acme" },
    update: {},
    create: {
      name: "Acme Inc",
      slug: "acme",
      description: "A demo workspace for testing",
    },
  });

  // Add user as workspace owner
  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      userId: user.id,
      role: "OWNER",
    },
  });

  // Create default channels
  const generalChannel = await prisma.channel.upsert({
    where: {
      workspaceId_slug: {
        workspaceId: workspace.id,
        slug: "general",
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      name: "general",
      slug: "general",
      topic: "General discussion",
      type: "PUBLIC",
      isDefault: true,
      createdById: user.id,
    },
  });

  const randomChannel = await prisma.channel.upsert({
    where: {
      workspaceId_slug: {
        workspaceId: workspace.id,
        slug: "random",
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      name: "random",
      slug: "random",
      topic: "Off-topic conversations",
      type: "PUBLIC",
      isDefault: true,
      createdById: user.id,
    },
  });

  // Add user to default channels
  for (const channel of [generalChannel, randomChannel]) {
    await prisma.channelMember.upsert({
      where: {
        channelId_userId: {
          channelId: channel.id,
          userId: user.id,
        },
      },
      update: {},
      create: {
        channelId: channel.id,
        userId: user.id,
      },
    });
  }

  // Create a welcome message
  await prisma.message.create({
    data: {
      content: "Welcome to the #general channel! This is where team-wide conversations happen.",
      type: "SYSTEM",
      authorId: user.id,
      channelId: generalChannel.id,
    },
  });

  console.log("Seed completed successfully!");
  console.log(`  User: ${user.email} (password: Password123)`);
  console.log(`  Workspace: ${workspace.name} (${workspace.slug})`);
  console.log(`  Channels: #general, #random`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
