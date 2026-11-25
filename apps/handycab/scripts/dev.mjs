import { spawn } from "node:child_process";
import { createServer } from "node:net";

const PREFERRED_PORT = Number(process.env.PORT) || 3001;

function findFreePort(port) {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.once("error", (err) => {
      if (err.code === "EADDRINUSE") {
        resolve(findFreePort(port + 1));
        return;
      }
      reject(err);
    });
    server.listen(port, () => {
      server.close((closeErr) => {
        if (closeErr) {
          reject(closeErr);
          return;
        }
        resolve(port);
      });
    });
  });
}

const port = await findFreePort(PREFERRED_PORT);
if (port !== PREFERRED_PORT) {
  console.warn(
    `Port ${PREFERRED_PORT} is in use, using available port ${port} instead.`,
  );
}

const child = spawn("next", ["dev", "--port", String(port)], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
