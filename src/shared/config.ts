function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}`);
  }

  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  dbUrl: requireEnv("DB_URL"),
  jwtSecret: requireEnv("JWT_SECRET"),
  isProduction: process.env.NODE_ENV === "production",
};
