import { Elysia, t } from "elysia";
import { registerUser, EmailAlreadyExistsError, loginUser, InvalidCredentialsError, getCurrentUser, UnauthorizedError } from "../services/users-service";

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
      name: t.String(),
      email: t.String(),
      password: t.String()
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
      email: t.String(),
      password: t.String()
    })
  })
  .get("/api/users/current", async ({ headers, set }) => {
    try {
      const authHeader = headers["authorization"];
      if (!authHeader) {
        set.status = 401;
        return { error: "Unauthorizeed" };
      }

      let token = "";
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      } else if (authHeader.startsWith("Bearer. ")) {
        token = authHeader.substring(8);
      } else {
        set.status = 401;
        return { error: "Unauthorizeed" };
      }

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
  });

