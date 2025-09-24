import { prisma } from "@/lib/prisma";

const norm = (s: string) => s.trim().toLowerCase();

async function main() {
  // distinct по label (Prisma умеет distinct)
  const rows = await prisma.userSubject.findMany({
    distinct: ["label"],
    select: { label: true },
    orderBy: { label: "asc" },
  });

  let created = 0;
  for (const r of rows) {
    const label = norm(r.label);
    await prisma.publicSubject.upsert({
      where: { label },              // в схеме label уникальный
      create: { label },
      update: {},
    });
    created++;
  }
  console.log(`Backfilled ${created} subjects into PublicSubject`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => process.exit(0));