import { prisma } from "../src/lib/prisma";
async function main() {
  const labels = ["react","nextjs","typescript","python","docker","ai"];
  for (const label of labels) {
    await prisma.publicSubject.upsert({
      where: { label },
      update: {},
      create: { label },
    });
  }
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
