# QEMU WebAssembly engine spike

This directory documents and coordinates the first real virtualization-engine build.

## Selected upstream projects

- Emulator: https://github.com/ktock/qemu-wasm
- Browser smoke-test integration: https://github.com/ktock/qemu-wasm-demo
- Why this route: the QEMU Wasm project documents system-emulator builds for `qemu-system-aarch64` and `qemu-system-x86_64`. Its demo repository builds actual ARM64 BusyBox Linux and x86_64 Alpine Linux guest images and includes working browser launch pages.
- Why not v86: it is an x86-focused PC emulator and does not provide the requested ARM64 guest route.
- Why not NekoDroid as the main engine: it is an ARMv7 emulator with a limited DEX HLE path, not a modern Android OS runtime.

## Build

From the repository root:

```bash
bash scripts/build-qemu-wasm.sh
bash scripts/check-qemu-wasm.sh
```

The build script clones the two upstream repositories and runs the upstream demo's reproducible Docker build. The output includes:
- ARM64 QEMU/Wasm engine and a Raspberry Pi 3A+ BusyBox Linux guest
- x86_64 QEMU/Wasm engine and an Alpine Linux guest

GitHub Actions runs this automatically when the build configuration changes, starts a COOP/COEP-enabled local server, and uses headless Chromium to verify that both guests print a Linux kernel banner. Generated engine and guest files are stored as a 14-day workflow artifact.

The upstream build uses Emscripten 3.1.50 and is experimental. The exact upstream commit IDs are written to `webdroid/runtime/BUILD_INFO.txt` in the artifact.

## What this build proves — and what it does not

A successful CI run proves that both QEMU/Wasm targets were built and that the ARM64 and x86_64 guest kernels emitted their Linux boot banners in Chromium. It does not yet prove a complete interactive userspace session or Android boot.

It does **not** prove that:
- an Android kernel/system image boots;
- Android graphics, Binder, audio, networking, camera, or sensors work;
- APK installation or execution works;
- Google Play services are available;
- the engine works when opened as a local `file://` HTML file.

The next gate is to run the included Linux guests in WebDroid's browser page, then investigate an Android-compatible machine/kernel/image combination.

## Browser deployment constraint

The upstream example uses pthreads and Emscripten worker files. Shared-memory threading generally requires a secure, cross-origin-isolated browser context (COOP/COEP headers). A plain local HTML file cannot set those response headers. The project therefore needs to validate both a no-thread build for direct-file experiments and a static HTTPS deployment with the required headers. "No application backend" is achievable with static hosting; strict offline single-file operation remains a separate constraint.
