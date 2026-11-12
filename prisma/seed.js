// Seeds three demo users so reviewers can exercise the sharing flow
// without a sign-up form. Safe to run repeatedly.
const { PrismaClient } = require("@prisma/client");
const { scryptSync, randomBytes } = require("node:crypto");

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  const password = process.env.DEMO_PASSWORD || "demo1234";
  const users = [
    { email: "alice@ajaia.test", name: "Alice Chen" },
    { email: "bob@ajaia.test", name: "Bob Martinez" },
    { email: "carol@ajaia.test", name: "Carol Okafor" },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name },
      create: { ...u, passwordHash: hashPassword(password) },
    });
  }

  console.log(`Seeded ${users.length} users (password: ${password})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
