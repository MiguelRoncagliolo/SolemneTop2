import { prisma } from "../src/lib/prisma";
import { getRubricSnapshot } from "../src/lib/evaluation/rubric";

async function main() {
  const snapshot = await getRubricSnapshot(prisma);
  console.log(JSON.stringify(snapshot, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
