import { Elysia, t } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { db } from "./db";
import { users } from "./db/schema";
import { usersRoute } from "./routes/users-route";

export const app = new Elysia()
  .use(
    swagger({
      documentation: {
        info: {
          title: "User Management API",
          version: "1.0.0",
          description: "Dokumentasi API untuk Sistem Manajemen Pengguna",
        },
      },
    })
  )
  .use(usersRoute)
  .get("/", () => "Hello Elysia", {
    detail: {
      tags: ["System"],
      summary: "Root Endpoint",
      description: "Endpoint sederhana untuk mengecek status kesehatan server.",
    },
    response: {
      200: t.String(),
    },
  })
  .get(
    "/users",
    async () => {
      try {
        const allUsers = await db.select().from(users);
        return allUsers;
      } catch (error) {
        console.error(error);
        return { error: "Database connection or query failed" };
      }
    },
    {
      detail: {
        tags: ["System"],
        summary: "Ambil Semua Pengguna",
        description: "Mengambil data seluruh pengguna langsung dari database (tujuan debugging/admin).",
      },
      response: {
        200: t.Union([
          t.Array(
            t.Object({
              id: t.Number(),
              name: t.String(),
              email: t.String(),
              createAt: t.Union([t.Date(), t.Null()]),
            })
          ),
          t.Object({
            error: t.String(),
          }),
        ]),
      },
    }
  );

if (process.env.NODE_ENV !== "test") {
  app.listen(3000);
  console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
  );
}

