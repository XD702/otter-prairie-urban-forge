#!/usr/bin/env node
/**
 * Run a command with `.grok/app-env.json` merged into its environment.
 *
 * `dev`, `build` and `preview` all route through this wrapper, so the dev
 * server, the built bundle and the preview server can never disagree about
 * `VITE_AUTH_ENABLED` — a divergence that only shows up as a built-output
 * mismatch long after the fact. Anything that starts Vite directly bypasses it.
 *
 * Only `VITE_`-prefixed keys are honored: the file is a build flag carrier, not
 * a secret store, and only `VITE_` vars reach the browser anyway. A real
 * `process.env` entry always wins, so an explicit override still works.
 *
 * That precedence also means the file governs this workspace only. A deployed
 * build runs with the provider's project env, where the deployer sets
 * `VITE_AUTH_ENABLED` itself (today unconditionally `"true"`), so the deployed
 * flag is the platform's, not this file's.
 *
 * Vite picks the values up because `loadEnv` prefix-matches entries already in
 * `process.env`, which is why the merge has to happen before Vite starts.
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { constants as osConstants } from "node:os";
import { delimiter, dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";

export const APP_ENV_REL_PATH = ".grok/app-env.json";

const VITE_PREFIX = "VITE_";

/**
 * Parse an app-env document, keeping only `VITE_`-prefixed string entries.
 * Anything unparseable is an empty environment — a workspace without the file
 * must behave exactly like today (auth on, no overrides).
 */
export function parseAppEnv(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return {};
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return {};
  const env = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (!key.startsWith(VITE_PREFIX)) continue;
    if (typeof value !== "string") continue;
    env[key] = value;
  }
  return env;
}

/** The app env recorded under `root`, or `{}` when the file is absent. */
export function readAppEnv(root) {
  try {
    return parseAppEnv(readFileSync(join(root, APP_ENV_REL_PATH), "utf8"));
  } catch {
    return {};
  }
}

/** File values under the process environment: an explicit override wins. */
export function mergeAppEnv(appEnv, processEnv) {
  return { ...appEnv, ...processEnv };
}

/**
 * Translate a child's `exit` `(code, signal)` into this process's exit status.
 *
 * Do not re-raise the signal with `process.kill(process.pid, signal)`: under
 * qemu-user (amd64 image builds on an arm host) a self-directed signal is
 * routinely delivered as SIGSEGV to the wrong process, which takes down the
 * test worker and fails the image build. `128 + signo` is what a shell reports
 * for a signal-killed command, so a cancelled `vite build` is still a failure.
 */
export function exitStatusFromChild(code, signal) {
  if (signal) {
    const signo = osConstants.signals[signal];
    return 128 + (typeof signo === "number" ? signo : 1);
  }
  return code ?? 1;
}

/** The workspace root (this file lives in `<root>/scripts/`). */
export function projectRoot() {
  return dirname(dirname(fileURLToPath(import.meta.url)));
}

/**
 * Resolve a bare command for `spawn()`.
 *
 * Unix: return `command` unchanged — `npm run` already puts `node_modules/.bin`
 * on PATH, and a bare `vite` is what the original wrapper spawned.
 * Windows: `spawn()` cannot see `vite` / `vite.cmd` shims, so prefer
 * `<root>/node_modules/.bin/<cmd>.cmd`, then PATH + PATHEXT.
 */
export function resolveCommand(command, options = {}) {
  const platform = options.platform ?? process.platform;
  const root = options.root ?? projectRoot();
  const exists = options.exists ?? existsSync;
  const pathEnv = options.pathEnv ?? process.env.PATH ?? "";
  const pathext = options.pathext ?? process.env.PATHEXT ?? ".COM;.EXE;.BAT;.CMD";

  if (platform !== "win32") return command;
  if (!command || isAbsolute(command) || command.includes("/") || command.includes("\\")) {
    return command;
  }

  const binDir = join(root, "node_modules", ".bin");
  for (const name of [`${command}.cmd`, `${command}.exe`, command]) {
    const candidate = join(binDir, name);
    if (exists(candidate)) return candidate;
  }

  const exts = String(pathext).split(";").filter(Boolean);
  for (const dir of String(pathEnv).split(delimiter)) {
    if (!dir) continue;
    const direct = join(dir, command);
    if (exists(direct)) return direct;
    for (const ext of exts) {
      const candidate = join(dir, command + ext);
      if (exists(candidate)) return candidate;
    }
  }
  return command;
}

/** JS entry from `node_modules/<command>/package.json` `bin`, if present. */
export function resolvePackageBin(command, root = projectRoot()) {
  try {
    const pkg = JSON.parse(readFileSync(join(root, "node_modules", command, "package.json"), "utf8"));
    const binRel = typeof pkg.bin === "string" ? pkg.bin : pkg.bin?.[command];
    if (typeof binRel !== "string") return null;
    const binJs = join(root, "node_modules", command, binRel);
    return existsSync(binJs) ? binJs : null;
  } catch {
    return null;
  }
}

/**
 * Whether `moduleUrl` is the script node was asked to run.
 *
 * Both sides are resolved through symlinks: node realpaths `import.meta.url`
 * but leaves `process.argv[1]` as typed, so comparing them raw makes a CLI
 * launched through a symlinked path (`/tmp` on macOS) a silent no-op.
 */
export function isMainModule(moduleUrl) {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return realpathSync(entry) === fileURLToPath(moduleUrl);
  } catch {
    return false;
  }
}

function main(argv) {
  const [command, ...args] = argv;
  if (!command) {
    console.error("usage: node scripts/with-app-env.mjs <command> [args…]");
    process.exit(2);
  }
  const env = mergeAppEnv(readAppEnv(projectRoot()), process.env);
  const resolved = resolveCommand(command);
  const winShim = process.platform === "win32" && /\.(cmd|bat)$/i.test(resolved);
  // npm's .cmd shim exits after launching node, so the wrapper would die.
  // Prefer `node <package bin>` so `npm run dev` stays attached; else cmd.exe.
  const packageBin = winShim ? resolvePackageBin(command) : null;
  const child = packageBin
    ? spawn(process.execPath, [packageBin, ...args], { stdio: "inherit", env })
    : winShim
      ? spawn(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", resolved, ...args], {
          stdio: "inherit",
          env,
        })
      : spawn(resolved, args, { stdio: "inherit", env });
  // The dev server is long-running and is stopped by signalling this wrapper.
  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
    process.on(signal, () => child.kill(signal));
  }
  child.on("error", (err) => {
    console.error(`[with-app-env] failed to run ${command}:`, err?.message || err);
    process.exit(127);
  });
  child.on("exit", (code, signal) => {
    process.exit(exitStatusFromChild(code, signal));
  });
}

if (isMainModule(import.meta.url)) {
  main(process.argv.slice(2));
}
