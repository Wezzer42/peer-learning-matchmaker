import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Hoisted session box: the mock reads this at runtime
const sessionBox = vi.hoisted(() => ({ value: null as any }));

// Hoisted mock for @/lib/auth BEFORE any imports happen
vi.mock("@/lib/auth", () => ({
    getServerAuthSession: vi.fn(() => Promise.resolve(sessionBox.value)),
}));

function jsonRequest(method: string, url: string, body?: unknown): Request {
    return new Request(url, {
        method,
        headers: { "content-type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
    });
}

describe("/api/me/subjects", () => {
    beforeEach(() => {
        // Reset module graph so the in-memory singleton store is fresh
        vi.resetModules();
        // Default to no session unless a test sets it
        sessionBox.value = null;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("rejects unauthorized access", async () => {
        // sessionBox.value = null; // explicit, but already defaulted in beforeEach
        const { GET, POST, PUT } = await import("@/app/api/me/subjects/route");

        const r1 = await GET(jsonRequest("GET", "http://localhost/api/me/subjects") as any);
        expect(r1.status).toBe(401);

        const r2 = await POST(
            jsonRequest("POST", "http://localhost/api/me/subjects", { label: "react" }) as any
        );
        expect(r2.status).toBe(401);

        const r3 = await PUT(
            jsonRequest("PUT", "http://localhost/api/me/subjects", [{ label: "react" }]) as any
        );
        expect(r3.status).toBe(401);
    });

    it("creates, lists, updates and deletes user subjects", async () => {
        // Simulate an authenticated user
        sessionBox.value = { user: { id: "u1" } };

        const { GET, POST, PUT } = await import("@/app/api/me/subjects/route");
        const { PATCH, DELETE } = await import("@/app/api/me/subjects/[id]/route");

        // Initially empty
        const listEmpty = await GET(jsonRequest("GET", "http://localhost/api/me/subjects") as any);
        expect(listEmpty.status).toBe(200);
        const emptyJson = (await listEmpty.json()) as { ok: boolean; data: any[] };
        expect(emptyJson.ok).toBe(true);
        expect(emptyJson.data).toHaveLength(0);

        // Create
        const createdRes = await POST(
            jsonRequest("POST", "http://localhost/api/me/subjects", { label: "react", level: 3 }) as any
        );
        expect(createdRes.status).toBe(201);
        const createdJson = (await createdRes.json()) as {
            ok: boolean;
            data: { id: string; label: string; level?: number };
        };
        expect(createdJson.ok).toBe(true);
        const id = createdJson.data.id;

        // List now has 1
        const list1 = await GET(jsonRequest("GET", "http://localhost/api/me/subjects") as any);
        const list1Json = (await list1.json()) as { ok: boolean; data: Array<{ id: string }> };
        expect(list1Json.data).toHaveLength(1);

        // Update
        const updatedRes = await PATCH(
            jsonRequest("PATCH", `http://localhost/api/me/subjects/${id}`, { level: 5 }) as any,
            { params: { id } } as any
        );
        expect(updatedRes.status).toBe(200);
        const updatedJson = (await updatedRes.json()) as { ok: boolean; data: { id: string; level?: number } };
        expect(updatedJson.data.level).toBe(5);

        // Replace all
        const replacedRes = await PUT(
            jsonRequest("PUT", "http://localhost/api/me/subjects", [
                { label: "nextjs", level: 4 },
                { label: "ai" },
            ]) as any
        );
        expect(replacedRes.status).toBe(200);
        const replacedJson = (await replacedRes.json()) as { ok: boolean; data: Array<{ id: string }> };
        expect(replacedJson.data).toHaveLength(2);

        // Delete one
        const deleteId = replacedJson.data[0].id;
        const delRes = await DELETE(
            jsonRequest("DELETE", `http://localhost/api/me/subjects/${deleteId}`) as any,
            { params: { id: deleteId } } as any
        );
        expect(delRes.status).toBe(200);
        const delJson = (await delRes.json()) as { ok: boolean };
        expect(delJson.ok).toBe(true);

        // Final list size
        const listFinal = await GET(jsonRequest("GET", "http://localhost/api/me/subjects") as any);
        const listFinalJson = (await listFinal.json()) as { ok: boolean; data: Array<{ id: string }> };
        expect(listFinalJson.data).toHaveLength(1);
    });
});
