import { describe, expect, it, beforeAll } from "bun:test";
import { Elysia } from "elysia";
import { usersRoute } from "./users-route";
import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";

const app = new Elysia().use(usersRoute);

describe("Users Route Integration Tests", () => {
  beforeAll(async () => {
    // Clean up test user if exists
    const existingUsers = await db.select().from(users).where(eq(users.email, "eko@localhost"));
    for (const u of existingUsers) {
      await db.delete(sessions).where(eq(sessions.userId, u.id));
      await db.delete(users).where(eq(users.id, u.id));
    }
  });

  it("should register, login, and get current user successfully", async () => {
    // 1. Register User
    const registerResponse = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "eko",
          email: "eko@localhost",
          password: "password123",
        }),
      })
    );
    expect(registerResponse.status).toBe(200);
    const registerBody = await registerResponse.json();
    expect(registerBody).toEqual({ data: "OK" });

    // 2. Login User
    const loginResponse = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "eko@localhost",
          password: "password123",
        }),
      })
    );
    expect(loginResponse.status).toBe(200);
    const loginBody = await loginResponse.json();
    expect(loginBody.data).toBeDefined();
    const token = loginBody.data;

    // 3. Get Current User with Bearer <token>
    const getResponse = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    );
    expect(getResponse.status).toBe(200);
    const getBody = await getResponse.json();
    expect(getBody.data).toBeDefined();
    expect(getBody.data.name).toBe("eko");
    expect(getBody.data.email).toBe("eko@localhost");
    expect(getBody.data.id).toBeTypeOf("number");

    // 4. Get Current User with Bearer. <token>
    const getResponseWithDot = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
        headers: {
          Authorization: `Bearer. ${token}`,
        },
      })
    );
    expect(getResponseWithDot.status).toBe(200);
    const getBodyWithDot = await getResponseWithDot.json();
    expect(getBodyWithDot.data).toBeDefined();
    expect(getBodyWithDot.data.name).toBe("eko");

    // 5. Unauthorized - Invalid Token
    const unauthorizedResponse = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
        headers: {
          Authorization: "Bearer invalid_token",
        },
      })
    );
    expect(unauthorizedResponse.status).toBe(401);
    const unauthorizedBody = await unauthorizedResponse.json();
    expect(unauthorizedBody).toEqual({ error: "Unauthorizeed" });

    // 6. Unauthorized - Missing Header
    const missingResponse = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
      })
    );
    expect(missingResponse.status).toBe(401);
    const missingBody = await missingResponse.json();
    expect(missingBody).toEqual({ error: "Unauthorizeed" });
  });
});
