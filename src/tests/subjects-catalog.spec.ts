import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sessionBox = vi.hoisted(() => ({ value: null as any }));
const envBox = vi.hoisted(() => ({ provider: process.env.DATABASE_PROVIDER, url: process.env.DATABASE_URL }));

vi.mock("@/lib/auth", () => ({
    getServerAuthSession: vi.fn(() => Promise.resolve(sessionBox.value)),
}));

vi.mock("@/lib/subjects-catalog", async (orig) => {
    const actual = (await orig()) as typeof import("@/lib/subjects-catalog");
    return {
        ...actual,
        getSubjectsCatalog: () => actual.getSubjectsCatalog(),
    };
});

function jsonRequest(method: string, url: string, body?: unknown): Request {
    return new Request(url, {
        method,
        headers: { "content-type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
    });
}

describe("/api/subjects (catalog)", () => {
    beforeEach(() => {
        vi.resetModules();
        sessionBox.value = null; // default: anonymous
        envBox.provider = process.env.DATABASE_PROVIDER;
        envBox.url = process.env.DATABASE_URL;
        process.env.DATABASE_PROVIDER = "sqlite";
        process.env.DATABASE_URL = "file:./test.db";
        process.env.USE_MEMORY_STORE = "1";
    });

    afterEach(() => {
        if (envBox.provider === undefined) {
            delete process.env.DATABASE_PROVIDER;
        } else {
            process.env.DATABASE_PROVIDER = envBox.provider;
        }
        if (envBox.url === undefined) {
            delete process.env.DATABASE_URL;
        } else {
            process.env.DATABASE_URL = envBox.url;
        }
        delete process.env.USE_MEMORY_STORE;
        vi.clearAllMocks();
    });

    it("lists public subjects without auth", async () => {
        const { GET } = await import("@/app/api/subjects/route");

        const res = await GET(jsonRequest("GET", "http://localhost/api/subjects?q=react") as any);
        expect(res.status).toBe(200);
        const json = (await res.json()) as { ok: boolean; data: unknown[] };
        expect(json.ok).toBe(true);
        expect(Array.isArray(json.data)).toBe(true);
    });

    it("requires auth for writes and supports POST, PATCH, DELETE, PUT when authorized", async () => {
        // Turn auth ON for this test
        sessionBox.value = { user: { id: "u1" } };

        const { GET, POST, PUT } = await import("@/app/api/subjects/route");
        const byId = await import("@/app/api/subjects/[id]/route");

        // POST create
        const createRes = await POST(
            jsonRequest("POST", "http://localhost/api/subjects", { label: "react", level: 3 }) as any
        );
        expect(createRes.status).toBe(201);
        const createJson = (await createRes.json()) as { ok: boolean; data: { id: string; label: string } };
        expect(createJson.ok).toBe(true);
        const sid = createJson.data.id;

        // GET list includes it
        const listRes = await GET(jsonRequest("GET", "http://localhost/api/subjects") as any);
        const listJson = (await listRes.json()) as { ok: boolean; data: Array<{ id: string }> };
        expect(listJson.data.some(s => s.id === sid)).toBe(true);

        // PATCH update
        const patchRes = await byId.PATCH(
            jsonRequest("PATCH", `http://localhost/api/subjects/${sid}`, { level: 5 }) as any,
            { params: { id: sid } } as any
        );
        expect(patchRes.status).toBe(200);
        const patchJson = (await patchRes.json()) as { ok: boolean; data: { id: string; level?: number } };
        expect(patchJson.data.level).toBe(5);

        // PUT bulk replace
        const putRes = await PUT(
            jsonRequest("PUT", "http://localhost/api/subjects", [
                { label: "nextjs", level: 4 },
                { label: "ai" },
            ]) as any
        );
        expect(putRes.status).toBe(200);
        const putJson = (await putRes.json()) as { ok: boolean; data: Array<{ id: string }> };
        expect(putJson.data).toHaveLength(2);

        // DELETE one
        const delId = putJson.data[0].id;
        const delRes = await byId.DELETE(
            jsonRequest("DELETE", `http://localhost/api/subjects/${delId}`) as any,
            { params: { id: delId } } as any
        );
        expect(delRes.status).toBe(200);
        const delJson = (await delRes.json()) as { ok: boolean };
        expect(delJson.ok).toBe(true);
    });

    it("rejects unauthorized writes", async () => {
        // Auth OFF for this test
        sessionBox.value = null;

        const { POST, PUT } = await import("@/app/api/subjects/route");
        const { PATCH, DELETE } = await import("@/app/api/subjects/[id]/route");

        const r1 = await POST(jsonRequest("POST", "http://localhost/api/subjects", { label: "x" }) as any);
        expect(r1.status).toBe(401);

        const r2 = await PUT(jsonRequest("PUT", "http://localhost/api/subjects", [{ label: "x" }]) as any);
        expect(r2.status).toBe(401);

        const r3 = await PATCH(
            jsonRequest("PATCH", "http://localhost/api/subjects/123", { level: 2 }) as any,
            { params: { id: "123" } } as any
        );
        expect(r3.status).toBe(401);

        const r4 = await DELETE(
            jsonRequest("DELETE", "http://localhost/api/subjects/123") as any,
            { params: { id: "123" } } as any
        );
        expect(r4.status).toBe(401);
    });
});
