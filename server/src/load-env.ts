try {
  process.loadEnvFile();
} catch {
  // no .env file present; rely on the process environment
}
