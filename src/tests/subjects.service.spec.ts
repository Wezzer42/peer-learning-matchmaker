import { makeSubjectsService } from "@/domain/subject/service";
import { MemorySubjectsStore } from "@/lib/subjectstore/memory";
import { describe, expect, it } from "vitest";

describe("Subjects service (per-user)", () => {
    it("validates payload and performs CRUD", async () => {
        const svc = makeSubjectsService(new MemorySubjectsStore());
        const u = "u1";
        expect(await svc.list(u)).toHaveLength(0);

        const s = await svc.add(u, { label: "react", level: 3 });
        expect(s.label).toBe("react");

        const all = await svc.list(u);
        expect(all).toHaveLength(1);

        const upd = await svc.update(u, s.id, { level: 5 });
        expect(upd?.level).toBe(5);

        await svc.setAll(u, [{ label: "nextjs", level: 4 }, { label: "ai" }]);
        const afterReplace = await svc.list(u);
        expect(afterReplace).toHaveLength(2);
    });
});