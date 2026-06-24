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

    // 7. Logout User - Success
    const logoutResponse = await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    );
    expect(logoutResponse.status).toBe(200);
    const logoutBody = await logoutResponse.json();
    expect(logoutBody).toEqual({ data: "OK" });

    // 8. Get Current User - Failure (Session already deleted)
    const getAfterLogoutResponse = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    );
    expect(getAfterLogoutResponse.status).toBe(401);
    const getAfterLogoutBody = await getAfterLogoutResponse.json();
    expect(getAfterLogoutBody).toEqual({ error: "Unauthorizeed" });

    // 9. Logout again - Failure (Unauthorized)
    const logoutAgainResponse = await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    );
    expect(logoutAgainResponse.status).toBe(401);
    const logoutAgainBody = await logoutAgainResponse.json();
    expect(logoutAgainBody).toEqual({ error: "Unauthorizeed" });

    // 10. Logout without header - Failure (Unauthorized)
    const logoutNoHeaderResponse = await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
      })
    );
    expect(logoutNoHeaderResponse.status).toBe(401);
    const logoutNoHeaderBody = await logoutNoHeaderResponse.json();
    expect(logoutNoHeaderBody).toEqual({ error: "Unauthorizeed" });
  });

  it("should fail validation when name, email, or password exceeds 255 characters on register", async () => {
    const longString = "a".repeat(256);
    
    // Test long name
    const resName = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: longString,
          email: "valid@email.com",
          password: "password123",
        }),
      })
    );
    expect(resName.status).toBe(400);

    // Test long email
    const resEmail = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "valid name",
          email: longString,
          password: "password123",
        }),
      })
    );
    expect(resEmail.status).toBe(400);

    // Test long password
    const resPassword = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "valid name",
          email: "valid@email.com",
          password: longString,
        }),
      })
    );
    expect(resPassword.status).toBe(400);
  });

  it("should fail validation when email or password exceeds 255 characters on login", async () => {
    const longString = "a".repeat(256);

    // Test long email
    const resEmail = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: longString,
          password: "password123",
        }),
      })
    );
    expect(resEmail.status).toBe(400);

    // Test long password
    const resPassword = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "valid@email.com",
          password: longString,
        }),
      })
    );
    expect(resPassword.status).toBe(400);
  });
});
