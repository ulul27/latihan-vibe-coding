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
    detail: {
      tags: ["Users"],
      summary: "Registrasi Pengguna Baru",
      description: "Endpoint untuk mendaftarkan pengguna baru ke dalam database."
    },
    body: t.Object({
      name: t.String({ maxLength: 255 }),
      email: t.String({ maxLength: 255 }),
      password: t.String({ maxLength: 255 })
    }),
    response: {
      200: t.Object({
        data: t.String()
      }),
      400: t.Object({
        error: t.String()
      }),
      500: t.Object({
        error: t.String()
      })
    }
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
    detail: {
      tags: ["Users"],
      summary: "Login Pengguna",
      description: "Melakukan verifikasi kredensial pengguna dan mengembalikan token session."
    },
    body: t.Object({
      email: t.String({ maxLength: 255 }),
      password: t.String({ maxLength: 255 })
    }),
    response: {
      200: t.Object({
        data: t.String()
      }),
      401: t.Object({
        error: t.String()
      }),
      500: t.Object({
        error: t.String()
      })
    }
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
  }, {
    detail: {
      tags: ["Users"],
      summary: "Ambil Profil Pengguna Aktif",
      description: "Mengambil informasi profil pengguna yang sedang login berdasarkan session token di header Authorization."
    },
    response: {
      200: t.Object({
        data: t.Object({
          id: t.Number(),
          name: t.String(),
          email: t.String(),
          created_at: t.Union([t.Date(), t.Null()])
        })
      }),
      401: t.Object({
        error: t.String()
      }),
      500: t.Object({
        error: t.String()
      })
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
  }, {
    detail: {
      tags: ["Users"],
      summary: "Logout Pengguna",
      description: "Menghapus session token pengguna dari database untuk mengakhiri session."
    },
    response: {
      200: t.Object({
        data: t.String()
      }),
      401: t.Object({
        error: t.String()
      }),
      500: t.Object({
        error: t.String()
      })
    }
  });

