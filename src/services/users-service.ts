import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export class EmailAlreadyExistsError extends Error {
  constructor() {
    super("Email sudah terdaftar");
    this.name = "EmailAlreadyExistsError";
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Email atau password salah");
    this.name = "InvalidCredentialsError";
  }
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorizeed");
    this.name = "UnauthorizedError";
  }
}

interface RegisterUserPayload {
  name: string;
  email: string;
  password: string;
}

interface LoginUserPayload {
  email: string;
  password: string;
}

export async function registerUser(payload: RegisterUserPayload) {
  // 1. Cek apakah email sudah terdaftar
  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, payload.email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new EmailAlreadyExistsError();
  }

  // 2. Hash password menggunakan bcrypt (bawaan Bun)
  const hashedPassword = await Bun.password.hash(payload.password, {
    algorithm: "bcrypt",
    cost: 10,
  });

  // 3. Simpan user baru ke database
  await db.insert(users).values({
    name: payload.name,
    email: payload.email,
    password: hashedPassword,
  });
}

export async function loginUser(payload: LoginUserPayload): Promise<string> {
  // 1. Lakukan query ke tabel users berdasarkan email
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, payload.email))
    .limit(1);

  // Jika user tidak ditemukan
  if (existingUser.length === 0) {
    throw new InvalidCredentialsError();
  }

  const user = existingUser[0];

  // 2. Verifikasi password dengan password hash di database
  const isPasswordMatch = await Bun.password.verify(payload.password, user.password);

  if (!isPasswordMatch) {
    throw new InvalidCredentialsError();
  }

  // 3. Buat token session (UUID)
  const token = crypto.randomUUID();

  // 4. Simpan session ke database
  await db.insert(sessions).values({
    token: token,
    userId: user.id,
  });

  return token;
}

interface UserResponse {
  id: number;
  name: string;
  email: string;
  created_at: Date | null;
}

export async function getCurrentUser(token: string): Promise<UserResponse> {
  const sessionResult = await db
    .select({
      userId: sessions.userId,
    })
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1);

  if (sessionResult.length === 0) {
    throw new UnauthorizedError();
  }

  const session = sessionResult[0];
  if (session.userId === null) {
    throw new UnauthorizedError();
  }

  const userResult = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createAt: users.createAt,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (userResult.length === 0) {
    throw new UnauthorizedError();
  }

  const user = userResult[0];

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    created_at: user.createAt,
  };
}

export async function logoutUser(token: string): Promise<void> {
  const sessionResult = await db
    .select({
      id: sessions.id,
    })
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1);

  if (sessionResult.length === 0) {
    throw new UnauthorizedError();
  }

  await db.delete(sessions).where(eq(sessions.token, token));
}


