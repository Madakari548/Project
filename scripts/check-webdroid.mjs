#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fail = message => { console.error("FAIL:", message); process.exitCode = 1; };
const run = (args, input) => spawnSync(process.execPath, args, { cwd: root, input, encoding: "utf8" });
const html = readFileSync(resolve(root, "webdroid/index.html"), "utf8");
const inspector = readFileSync(resolve(root, "webdroid/apk-inspector.js"), "utf8");
const checks = [
  ["dashboard contains APK inspector script", html.includes('<script src="apk-inspector.js"></script>')],
  ["APK inspector is compatible with classic script loading", !inspector.includes("export ") && inspector.includes("window.inspectWebDroidApk = inspectApk")],
  ["device profiles are persisted in IndexedDB", html.includes("DEVICE_STORE='devices'") && html.includes("saveDevices()")],
  ["APK files can be downloaded from local archive", html.includes("download.textContent='保存'")],
  ["APK manifest metadata is displayed", html.includes("row.manifest?.packageName")],
  ["QEMU Linux smoke tests are explicitly not Android", readFileSync(resolve(root, "webdroid/qemu-smoke/raspi3ap.html"), "utf8").includes("Androidではありません")],
];
for (const [name, ok] of checks) { console.log((ok ? "PASS " : "FAIL ") + name); if (!ok) fail(name); }
const apkTest = run([resolve(root, "scripts/test-apk-inspector.mjs")]);
if (apkTest.status !== 0) { console.error(apkTest.stderr || apkTest.stdout); fail("APK ZIP/manifest parser test"); } else console.log(apkTest.stdout.trim());
const inspectorCheck = run(["--check", resolve(root, "webdroid/apk-inspector.js")]);
if (inspectorCheck.status !== 0) { console.error(inspectorCheck.stderr); fail("APK inspector JavaScript syntax"); } else console.log("PASS APK inspector JavaScript syntax");
const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join("\n");
const inlineCheck = run(["--check"], inline);
if (inlineCheck.status !== 0) { console.error(inlineCheck.stderr); fail("dashboard inline JavaScript syntax"); } else console.log("PASS dashboard inline JavaScript syntax");
for (const path of ["webdroid/ENGINE_PLAN.md","webdroid/ENGINE_RESEARCH.md","webdroid/engine/README.md","scripts/build-qemu-wasm.sh","scripts/check-qemu-wasm.sh"]) {
  if (!existsSync(resolve(root, path))) fail("required project file missing: " + path);
}
if (process.exitCode) process.exit(process.exitCode);
console.log("WebDroid static checks passed.");
