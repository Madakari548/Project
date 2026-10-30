# WebDroid

WebDroid is an experimental project to build an Android virtualization environment that runs in a web browser.

## Current status: 0.4.0 — Android guest research and APK inspection

The browser workspace currently provides:
- Device profile management (up to four in this preview), persisted in IndexedDB
- Local APK archive using IndexedDB, with binary AndroidManifest metadata inspection, SHA-256 when available, and file export (storage only, not installation)
- Live browser capability checks (WebAssembly, SharedArrayBuffer, COOP/COEP isolation, memory64, OPFS, IndexedDB)
- Automated build pipeline for experimental QEMU/WebAssembly system emulators targeting ARM64 and x86_64
- Separate ARM64 BusyBox Linux and x86_64 Alpine Linux browser boot-test pages

**Important: WebDroid is not yet an Android emulator.** The Linux pages are VM-engine smoke tests. APKs are not installed or executed, and no Android guest has been booted.

## Open the workspace

Open `index.html` in a modern browser to use the local dashboard and APK archive. The browser capability panel will show which runtime features are available in that context.

## Build the VM engines and Linux guests

From the repository root:

```bash
bash scripts/build-qemu-wasm.sh
bash scripts/check-qemu-wasm.sh
```

GitHub Actions runs the build when engine configuration changes and uploads the compiled QEMU/Wasm binaries and Linux guest assets as the `webdroid-qemu-wasm-engines` workflow artifact. The artifact is temporary (14 days). Open the [QEMU build workflow](https://github.com/Madakari548/Project/actions/workflows/build-qemu-wasm.yml), select a successful run, and download its artifact.

After extracting the artifact, place its `raspi3ap/` and `alpine-x86_64/` folders under `webdroid/runtime/`. Then serve the repository from a static HTTPS origin with COOP/COEP isolation and open:
- [ARM64 Linux boot test](./qemu-smoke/raspi3ap.html)
- [x86_64 Linux boot test](./qemu-smoke/alpine-x86_64.html)

The test pages use the COI service worker to request cross-origin isolation on static hosting. The first visit may reload once while the service worker takes control.

See [engine integration notes](./engine/README.md), [engine research](./ENGINE_RESEARCH.md), and the [implementation roadmap](./ENGINE_PLAN.md).

## Important constraints

The selected QEMU/Wasm toolchain is experimental and currently uses an older Emscripten version. Its pthread build needs browser cross-origin isolation. A plain local `file://` launch cannot register the required service worker or set response headers, so the Linux VM tests need static HTTPS hosting. The direct-open dashboard and the full VM runtime have different browser requirements.

A successful Linux boot only validates the VM engine. Android still needs a compatible Android kernel, system image, machine model, graphics/input devices, storage layout, and Android userspace integration. ARM64 and x86_64 must be validated independently. Google Play services are proprietary and are not supplied by this project.
