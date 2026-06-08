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

