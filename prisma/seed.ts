import { prisma } from "../src/lib/prisma";

async function main() {
  console.log(
    "No seeding ejecutado. Este proyecto evita hardcodear datos reales. Seeds demo se agregarán explícitamente en Sprint 2.",
  );
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exitCode = 1;
});
