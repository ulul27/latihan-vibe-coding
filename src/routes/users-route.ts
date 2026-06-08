import { Elysia, t } from "elysia";
import { registerUser, EmailAlreadyExistsError, loginUser, InvalidCredentialsError } from "../services/users-service";

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
  });

