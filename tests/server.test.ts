import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { expect, test } from "vitest";

/**
 * Reserves and releases an available loopback TCP port.
 */
async function getAvailablePort(): Promise<number> {
  const server = createServer();
  let port: number | undefined;

  await new Promise<void>((resolve, reject) => {
    /** Resolves after the temporary listener closes. */
    function handleClose(): void {
      resolve();
    }

    /** Rejects when the temporary listener cannot bind. */
    function handleError(error: Error): void {
      reject(error);
    }

    /** Reads the assigned port and closes the temporary listener. */
    function handleListening(): void {
      const address = server.address();
      if (address === null || typeof address === "string") {
        reject(new Error("Expected a TCP address."));
        return;
      }

      port = address.port;
      server.close(handleClose);
    }

    server.once("error", handleError);
    server.listen(0, "127.0.0.1", handleListening);
  });

  if (port === undefined) {
    throw new Error("Could not determine the assigned port.");
  }

  return port;
}

/**
 * Polls health until the built server is ready or the deadline expires.
 */
async function waitForHealth(url: string): Promise<Response> {
  const deadline = Date.now() + 5_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return response;
      }
    } catch {
      // The process may still be binding its socket.
    }

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 25);
    });
  }

  throw new Error("Built server did not become healthy.");
}

/**
 * Verifies the compiled production entry point through real HTTP.
 */
async function servesHealthFromTheBuiltProcess(): Promise<void> {
  const port = await getAvailablePort();
  const child = spawn(process.execPath, ["dist/server.js"], {
    env: {
      ...process.env,
      CRAWLER_API_BASE_URL: "https://crawler.internal",
      CRAWLER_API_TOKEN: "test-secret",
      PORT: String(port),
    },
    stdio: "pipe",
  });

  try {
    const response = await waitForHealth(`http://127.0.0.1:${port}/health`);
    await expect(response.json()).resolves.toEqual({ status: "ok" });
  } finally {
    child.kill("SIGTERM");
  }
}

test(
  "serves health from the built Node process",
  servesHealthFromTheBuiltProcess,
);
