import vinext from "vinext";
import { defineConfig } from "vite";
import { sites } from "./build/sites-vite-plugin";

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

export default defineConfig(async () => {
  // Prisma ships native query engines resolved via __dirname at runtime, so
  // it must stay external to the server bundles and load from node_modules.
  const prismaExternals = ["@prisma/client", ".prisma/client"];

  return {
    ssr: { external: prismaExternals },
    environments: {
      rsc: { resolve: { external: prismaExternals } },
      ssr: { resolve: { external: prismaExternals } },
    },
    server: isCodexSeatbeltSandbox
      ? { watch: { useFsEvents: false, usePolling: true } }
      : undefined,
    plugins: [vinext(), sites()],
  };
});
