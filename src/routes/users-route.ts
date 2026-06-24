import { Elysia, t } from "elysia";
import { registerUser, EmailAlreadyExistsError, loginUser, InvalidCredentialsError, getCurrentUser, UnauthorizedError, logoutUser } from "../services/users-service";

function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  if (authHeader.startsWith("Bearer ")) return authHeader.substring(7);
  if (authHeader.startsWith("Bearer. ")) return authHeader.substring(8);
  return null;
}

export const usersRoute = new Elysia()
  .post("/api/users", async ({ body, set }) => {
    try {
      await registerUser(body);
      return { data: "OK" };
    } catch (error) {
      if (error instanceof EmailAlreadyExistsError) {
        set.status = 400;
        return { error: error.message };
      }
      set.status = 500;
      return { error: "Internal Server Error" };
    }
  }, {
    body: t.Object({
      name: t.String({ maxLength: 255 }),
      email: t.String({ maxLength: 255 }),
      password: t.String({ maxLength: 255 })
    })
  })
  .post("/api/users/login", async ({ body, set }) => {
    try {
      const token = await loginUser(body);
      return { data: token };
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        set.status = 401;
        return { error: error.message };
      }
      set.status = 500;
      return { error: "Internal Server Error" };
    }
  }, {
    body: t.Object({
      email: t.String({ maxLength: 255 }),
      password: t.String({ maxLength: 255 })
    })
  })
  .get("/api/users/current", async ({ headers, set }) => {
    try {
      const token = extractToken(headers["authorization"]);
      if (!token) {
        set.status = 401;
        return { error: "Unauthorizeed" };
      }

      const user = await getCurrentUser(token);
      return { data: user };
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        set.status = 401;
        return { error: error.message };
      }
      set.status = 500;
      return { error: "Internal Server Error" };
    }
  })
  .delete("/api/users/logout", async ({ headers, set }) => {
    try {
      const token = extractToken(headers["authorization"]);
      if (!token) {
        set.status = 401;
        return { error: "Unauthorizeed" };
      }

      await logoutUser(token);
      return { data: "OK" };
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        set.status = 401;
        return { error: error.message };
      }
      set.status = 500;
      return { error: "Internal Server Error" };
    }
  });

