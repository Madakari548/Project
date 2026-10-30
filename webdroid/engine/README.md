# QEMU WebAssembly engine spike

This directory documents and coordinates the first real virtualization-engine build.

## Selected upstream

- Repository: https://github.com/justinmeza/qemu-wasm
- License: QEMU is primarily GPL-2.0-or-later with per-file exceptions; retain upstream notices and verify the exact source/license obligations before redistributing binaries.
- Why: its documented build targets include `qemu-system-aarch64` and `qemu-system-x86_64`, and it provides a browser-oriented TCG/WebAssembly backend.
- Why not v86: it is an x86-focused PC emulator and does not provide the required ARM64 guest route.
- Why not NekoDroid as the main engine: it is an ARMv7 emulator with a limited DEX HLE path, not a modern Android OS runtime.

## Build

Run from the repository root:

```bash
bash scripts/build-qemu-wasm.sh
```

The script clones the upstream source, builds its Docker toolchain, and compiles both system-emulator targets. GitHub Actions runs this automatically when the build configuration changes and stores the resulting files as a 14-day workflow artifact.

The upstream build uses Emscripten 3.1.50 and a browser-specific QEMU fork. This is an experimental compatibility spike, not a promise of current upstream QEMU compatibility.

## What this build proves — and what it does not

A successful build proves that the QEMU system-emulator binaries can be compiled to WebAssembly for the two requested guest machine architectures. It does **not** prove that:
- an Android kernel/system image boots;
- Android graphics, Binder, audio, networking, camera, or sensors work;
- APK installation or execution works;
- Google Play services are available;
- the engine works when opened as a local `file://` HTML file.

The next gate is to boot a small ARM64 Linux guest with a serial console, then test a compatible Android image. A bootable Android image and its matching kernel/device configuration are separate inputs.

## Browser deployment constraint

The upstream example uses pthreads and Emscripten worker files. Shared-memory threading generally requires a secure, cross-origin-isolated browser context (COOP/COEP headers). A plain local HTML file cannot set those response headers. The project therefore needs to validate both a no-thread build for direct-file experiments and a static HTTPS deployment with the required headers. "No server" can mean no application backend; a static host may still be required for the full threaded build.
