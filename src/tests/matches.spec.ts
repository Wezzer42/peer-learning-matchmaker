import { makeMatchService } from "@/domain/match/service";
import { MemoryStore } from "@/lib/datastore/memory";
import { describe, expect, it } from "vitest";

describe("matches API service", () => {
    it("creates and lists matches", async () => {
        const svc = makeMatchService(new MemoryStore());
        const created = await svc.create({
            aUserId: "u1", bUserId: "u2", topic: "react", score: 0.92
        });
        expect(created.id).toBeTypeOf("string");

        const list = await svc.list({ userId: "u1" });
        expect(list).toHaveLength(1);
        expect(list[0].topic).toBe("react");
    });
});