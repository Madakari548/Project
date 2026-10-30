# WebDroid engine plan

## Product constraints

- Browser execution; no user-operated application backend.
- Prefer a distributable local HTML entry point, while allowing static HTTPS hosting when browser security features require it.
- Target ARM64 and x86_64 guests, but report actual tested compatibility rather than assuming it from the UI.
- Persistent local storage and touch, keyboard, pointer, audio, and network adapters.
- Multiple isolated device instances.

## Reality check

A full modern Android environment requires a guest CPU, memory and device model, boot firmware/kernel, Android system images, writable block storage, graphics and input devices, and a bridge between guest devices and browser APIs. Browser sandbox restrictions also affect host camera, microphone, GPU, and network access.

A single HTML file can be a launcher/container, but it cannot conjure a complete Android OS. A practical offline distribution would need the compiled emulator runtime and compatible Android images packaged alongside or embedded in the distribution. File-size and browser-memory constraints are substantial.

The selected pthread-enabled QEMU/Wasm path requires a cross-origin-isolated secure context. A local `file://` page cannot set COOP/COEP response headers or register a service worker, so strict direct-file operation and full threaded VM operation may need to be separate delivery modes.

Google Play services are proprietary Google components. An open-source emulator cannot simply recreate equivalent authenticated Play functionality. Distinguish AOSP-compatible operation from licensed Google Play support.

## Milestones

### M0 — Workspace shell
- [x] Browser-openable dashboard
- [x] Device profile UI
- [x] IndexedDB APK archive (storage only; not installation)
- [x] Live browser capability checks
- [x] Honest capability/status reporting
- [x] Persist device profiles in IndexedDB
- [x] Inspect APK ZIP manifest metadata and calculate SHA-256 when Web Crypto is available
- [x] Download APKs back from the local archive

### M1 — VM engine and build pipeline
- [x] Select experimental QEMU/Wasm as the first engine candidate
- [x] Add automated ARM64 and x86_64 engine build
- [x] Add bootable ARM64 BusyBox and x86_64 Alpine smoke-test images
- [x] Add browser boot-test pages and Chromium automation
- [x] Wire the upstream browser-side networking stack into the x86_64 Linux test page (guest connectivity still needs runtime verification)
- [x] Add static syntax and project-wiring checks for the dashboard and APK inspector
- [ ] Obtain a successful CI run and confirm both Linux guest kernel banners
- [ ] Measure startup time, memory use, and browser compatibility on ChromeOS
- [ ] Validate persistent virtual disk and input behavior

### M2 — Android guest boot
- [x] Select LineageOS-for-QEMU as the first Android VM candidate for ARM64 and x86_64
- [ ] Retrieve and inspect the published VM archives, exact file layout, checksums, and licenses
- [ ] Confirm QEMU/Wasm support for the required ARM `virt` / x86 `q35` machines, UEFI, qcow2, VirtIO GPU, USB, and networking
- [ ] Validate that the shipped LineageOS kernels and firmware boot with the browser QEMU build
- [ ] Boot a real Android guest in the browser
- [ ] Display guest framebuffer and provide touch/pointer/keyboard input
- [ ] Persist the Android virtual disk across sessions

### M3 — APK execution
- [x] Parse APK binary Manifest package name/version and calculate a local SHA-256 fingerprint when supported
- [ ] Full APK compatibility analysis (split APKs, ABI, SDK requirements, signing and native libraries)
- [ ] Install APKs inside the Android guest using Android package manager
- [ ] Launch APKs and handle lifecycle
- [ ] Audio output and input
- [ ] Guest network adapter

### M4 — Device and platform features
- [ ] Multiple isolated Android guest instances
- [ ] Camera and microphone bridge (permission-gated)
- [ ] Snapshot / restore
- [ ] ARM64 and x86_64 Android compatibility matrix
- [ ] Play-services compatibility assessment; no claim of Google certification without authorization

## Acceptance criteria

A feature is complete only when tested in a real guest OS. UI controls, file selection, simulated boot animations, or a successful emulator compilation do not count as an Android boot or APK execution.
