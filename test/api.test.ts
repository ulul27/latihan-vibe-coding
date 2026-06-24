import { describe, expect, it, mock, beforeEach } from "bun:test";

// Define mock functions for the service
const mockRegisterUser = mock();
const mockLoginUser = mock();
const mockGetCurrentUser = mock();
const mockLogoutUser = mock();

// Mock the services module
mock.module("../src/services/users-service", () => {
  class EmailAlreadyExistsError extends Error {
    constructor() {
      super("Email sudah terdaftar");
      this.name = "EmailAlreadyExistsError";
    }
  }

  class InvalidCredentialsError extends Error {
    constructor() {
      super("Email atau password salah");
      this.name = "InvalidCredentialsError";
    }
  }

  class UnauthorizedError extends Error {
    constructor() {
      super("Unauthorizeed");
      this.name = "UnauthorizedError";
    }
  }

  return {
    registerUser: mockRegisterUser,
    loginUser: mockLoginUser,
    getCurrentUser: mockGetCurrentUser,
    logoutUser: mockLogoutUser,
    EmailAlreadyExistsError,
    InvalidCredentialsError,
    UnauthorizedError,
  };
});

// Define mock for the db SELECT query
const mockSelectFrom = mock();

// Mock the db module
mock.module("../src/db", () => {
  return {
    db: {
      select: mock(() => ({
        from: mockSelectFrom,
      })),
    },
  };
});

// Import the app after mocking modules
import { app } from "../src/index";

describe("API Unit Tests", () => {
  beforeEach(() => {
    // Reset all mock behaviors before each test
    mockRegisterUser.mockReset();
    mockLoginUser.mockReset();
    mockGetCurrentUser.mockReset();
    mockLogoutUser.mockReset();
    mockSelectFrom.mockReset();
  });

  // ==========================================
  // 1. Root & Base Users Endpoint
  // ==========================================
  describe("Root & Base Users Endpoints", () => {
    it("should respond with 200 and 'Hello Elysia' on GET /", async () => {
      const response = await app.handle(new Request("http://localhost/"));
      expect(response.status).toBe(200);
      expect(await response.text()).toBe("Hello Elysia");
    });

    it("should respond with 200 and list of users on GET /users when database is healthy", async () => {
      const mockUsers = [
        { id: 1, name: "Alice", email: "alice@example.com", createAt: null },
        { id: 2, name: "Bob", email: "bob@example.com", createAt: null },
      ];
      mockSelectFrom.mockResolvedValue(mockUsers);

      const response = await app.handle(new Request("http://localhost/users"));
      expect(response.status).toBe(200);
      
      const body = await response.json();
      expect(body).toEqual(mockUsers);
    });

    it("should respond gracefully on GET /users when database query fails", async () => {
      mockSelectFrom.mockRejectedValue(new Error("Database connection failed"));

      const response = await app.handle(new Request("http://localhost/users"));
      // The application catches the error and returns a status 200 (or other configured code) with error message
      const body = await response.json();
      expect(body).toEqual({ error: "Database connection or query failed" });
    });
  });

  // ==========================================
  // 2. Register Endpoint (POST /api/users)
  // ==========================================
  describe("Register User Endpoint (POST /api/users)", () => {
    it("should register successfully with valid payload", async () => {
      mockRegisterUser.mockResolvedValue(undefined);

      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "New User",
            email: "new@example.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({ data: "OK" });
    });

    it("should fail with 400 if email is already registered", async () => {
      const { EmailAlreadyExistsError } = require("../src/services/users-service");
      mockRegisterUser.mockRejectedValue(new EmailAlreadyExistsError());

      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Existing User",
            email: "existing@example.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toEqual({ error: "Email sudah terdaftar" });
    });

    it("should reject with 422 if validation length constraint (>255) is violated", async () => {
      const longString = "a".repeat(256);

      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: longString,
            email: "test@example.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(422);
    });

    it("should reject with 422 if payload is missing required fields", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Missing Email and Password",
          }),
        })
      );

      expect(response.status).toBe(422);
    });
  });

  // ==========================================
  // 3. Login Endpoint (POST /api/users/login)
  // ==========================================
  describe("Login User Endpoint (POST /api/users/login)", () => {
    it("should login successfully with valid credentials", async () => {
      mockLoginUser.mockResolvedValue("mocked-session-token");

      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "user@example.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({ data: "mocked-session-token" });
    });

    it("should fail with 401 when invalid credentials are provided", async () => {
      const { InvalidCredentialsError } = require("../src/services/users-service");
      mockLoginUser.mockRejectedValue(new InvalidCredentialsError());

      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "wrong@example.com",
            password: "wrongpassword",
          }),
        })
      );

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toEqual({ error: "Email atau password salah" });
    });

    it("should reject with 422 if validation length constraint (>255) is violated", async () => {
      const longString = "a".repeat(256);

      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: longString,
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(422);
    });

    it("should reject with 422 if login fields are missing", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "only_email@example.com",
          }),
        })
      );

      expect(response.status).toBe(422);
    });
  });

  // ==========================================
  // 4. Get Current User Endpoint (GET /api/users/current)
  // ==========================================
  describe("Get Current User Endpoint (GET /api/users/current)", () => {
    const mockUser = {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      created_at: null,
    };

    it("should fetch current user profile with valid Bearer token", async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);

      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: { Authorization: "Bearer valid-token" },
        })
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({ data: mockUser });
      expect(mockGetCurrentUser).toHaveBeenCalledWith("valid-token");
    });

    it("should fetch current user profile with Bearer. dot format", async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);

      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: { Authorization: "Bearer. dot-token" },
        })
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({ data: mockUser });
      expect(mockGetCurrentUser).toHaveBeenCalledWith("dot-token");
    });

    it("should fail with 401 when Authorization header is missing", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
        })
      );

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toEqual({ error: "Unauthorizeed" });
    });

    it("should fail with 401 when invalid token is provided", async () => {
      const { UnauthorizedError } = require("../src/services/users-service");
      mockGetCurrentUser.mockRejectedValue(new UnauthorizedError());

      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: { Authorization: "Bearer invalid-token" },
        })
      );

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toEqual({ error: "Unauthorizeed" });
    });
  });

  // ==========================================
  // 5. Logout Endpoint (DELETE /api/users/logout)
  // ==========================================
  describe("Logout User Endpoint (DELETE /api/users/logout)", () => {
    it("should logout successfully with valid token", async () => {
      mockLogoutUser.mockResolvedValue(undefined);

      const response = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
          headers: { Authorization: "Bearer valid-token" },
        })
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({ data: "OK" });
      expect(mockLogoutUser).toHaveBeenCalledWith("valid-token");
    });

    it("should fail with 401 when Authorization header is missing", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
        })
      );

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toEqual({ error: "Unauthorizeed" });
    });

    it("should fail with 401 when invalid/already logged out token is provided", async () => {
      const { UnauthorizedError } = require("../src/services/users-service");
      mockLogoutUser.mockRejectedValue(new UnauthorizedError());

      const response = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
          headers: { Authorization: "Bearer dead-token" },
        })
      );

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toEqual({ error: "Unauthorizeed" });
    });
  });
});
