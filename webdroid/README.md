# WebDroid

WebDroid is an experimental project to build an Android virtualization environment that runs in a web browser.

## Current status: 0.2.0 — engine build spike

The browser workspace currently provides:
- Device profile management (up to four in this preview)
- Local APK archive using IndexedDB (storage only, not installation)
- A documented engine research and feasibility plan
- An automated build pipeline for experimental QEMU/WebAssembly system emulators targeting ARM64 and x86_64

**Important: WebDroid is not yet an Android emulator.** The QEMU build pipeline is being prepared; even a successful QEMU build does not prove that Android boots. APKs are not installed or executed yet.

## Open the workspace

Open `index.html` in a modern browser to use the local dashboard and APK archive.

## Build the VM engines

The reproducible build script is:

```bash
bash scripts/build-qemu-wasm.sh
bash scripts/check-qemu-wasm.sh
```

A GitHub Actions workflow also runs when the build configuration changes. It uploads the compiled QEMU/WebAssembly files as a temporary workflow artifact.

See [engine integration notes](./engine/README.md), [engine research](./ENGINE_RESEARCH.md), and the [implementation roadmap](./ENGINE_PLAN.md).

## Important browser constraints

The selected upstream QEMU/Wasm project is experimental and uses an older Emscripten toolchain. Its pthread build needs browser cross-origin isolation headers. A strict local `file://` launch cannot set those headers, so direct-file compatibility must be tested separately from static HTTPS hosting.

A real Android guest also needs a compatible kernel, system image, machine model, graphics/input devices, and storage layout. ARM64 and x86_64 guest builds are separate compatibility targets. Google Play services are proprietary and are not supplied by this project.
