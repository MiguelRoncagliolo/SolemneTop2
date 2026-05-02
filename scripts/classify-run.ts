import { runPainPointClassification } from "../src/lib/classifier/service";

async function main() {
  const summary = await runPainPointClassification({
    maxPairs: process.env.CLASSIFY_MAX_PAIRS ? Number(process.env.CLASSIFY_MAX_PAIRS) : 200,
  });
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
