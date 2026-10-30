# Browser Android engine research (2026-10-30)

## Executive decision

Do not integrate v86 as the main engine for the requested modern Android target. Keep it as a possible legacy x86 experiment only.

Run a focused feasibility spike around QEMU compiled to WebAssembly for ARM64 guests, while separately evaluating whether a constrained APK runtime can offer useful early functionality. Do not describe either path as a complete Android emulator until a real Android guest boots and ordinary APKs install and run.

## Findings

### 1. QEMU in WebAssembly / Glasshouse

Glasshouse reports booting an ARM64 phone OS in a browser using QEMU compiled to WebAssembly, a custom ARM64 kernel, browser-managed persistent storage, and a user-supplied restore image. Its published requirements include a modern desktop Chrome, 64-bit Wasm memory, roughly 10 GB of free browser storage, and substantial host RAM. It reports touch and persistent disk support, while sound, network, and camera are listed as not yet implemented.

This is evidence that browser-based ARM64 OS virtualization is technically possible, but it is not evidence that a generic modern Android image will boot unchanged. Glasshouse uses a custom kernel and device drivers and a specific OS restore-image workflow. We must inspect licensing, source availability, kernel/device assumptions, and image compatibility before reusing anything.

Source: https://glasshouse.mojolayers.com/info

### 2. NekoDroid

NekoDroid is an early browser-native ARM emulator written in Rust/WebAssembly. Its published current feature set includes an ARMv7-era CPU core, a limited set of emulated devices, Linux boot plumbing, and a small Dalvik/DEX HLE path demonstrated with a hello APK. Its own README says arbitrary Play Store APKs, multidex, JNI/native libraries, and full Android userspace (zygote, Binder fidelity, SurfaceFlinger) are not implemented.

It may be useful as a research reference or a constrained APK execution experiment, but it is not currently a full Android OS emulator and does not meet the requested ARM64 + x86_64 target.

Source: https://github.com/nishal21/NekoDroid

### 3. v86

v86 is a mature browser-based x86 PC emulator. Its published compatibility notes list Android-x86 tested up to 4.4-r2. That makes it unsuitable as the primary route to a current Android release, and it does not solve ARM64 guest support.

It can remain a useful fallback for a legacy x86 Android proof of concept, not the foundation of the target product.

Source: https://github.com/copy/v86

### 4. QEMU Wasm and an existing Linux boot demo

The practical candidate is now the experimental `ktock/qemu-wasm` fork. Its README documents Emscripten builds of both `qemu-system-aarch64` and `qemu-system-x86_64`. A companion project, `ktock/qemu-wasm-demo`, builds a real ARM64 Raspberry Pi 3A+ BusyBox Linux guest and an x86_64 Alpine Linux guest, then starts them in a browser with QEMU/Wasm and an xterm pseudo-terminal.

This is a much better first engineering milestone than trying to boot Android immediately: it tests both requested guest CPU architectures using actual guest kernels and root filesystems. It is still an experimental QEMU fork, not an Android emulator. The upstream build currently pins Emscripten 3.1.50, and the browser examples rely on pthreads, worker files, and COOP/COEP isolation.

Sources:
- https://github.com/ktock/qemu-wasm
- https://github.com/ktock/qemu-wasm-demo

The 2026 QEMU Wasm issue tracker also shows active development and outstanding correctness/boot issues, including a report about Asyncify rewind during guest SD reads and a TCG POPCNT bug. This reinforces the need to test the exact built guest rather than assuming upstream claims guarantee compatibility.

Source: https://github.com/ktock/qemu-wasm/issues

## Recommended engineering plan

### Spike A — QEMU/Wasm feasibility (build pipeline added)
1. Build the upstream ARM64 and x86_64 QEMU/Wasm targets.
2. Build the companion ARM64 BusyBox and x86_64 Alpine guest images.
3. Boot both Linux guests in the browser and record failures, startup time, memory use, and console output.
4. Validate COOP/COEP service-worker behavior on static HTTPS hosting and compare it with the direct-file dashboard.
5. Only after Linux smoke tests pass, begin Android machine/kernel/image compatibility work.

### Spike B — Android boot feasibility
1. Select a legally redistributable AOSP-derived Android image and compatible kernel/device model.
2. Confirm boot chain, virtual block devices, framebuffer/GPU path, input devices, and init requirements.
3. Attempt a real Android boot; a simulated phone UI does not count.
4. Only after a successful boot, test package installation and an ordinary non-trivial APK.

### Spike C — APK execution alternative
Evaluate NekoDroid only as a separate constrained execution path. Clearly label supported APK/API/DEX subsets. Do not present HLE execution as Android compatibility.

## Product constraints and honest status

- A single HTML file can act as a launcher, but a practical emulator will likely need large runtime and guest-image assets alongside it or downloaded on first use. A strict offline single-file bundle is a separate packaging challenge.
- Local-file URL behavior, WebAssembly memory limits, browser storage quotas, and cross-origin isolation need explicit tests. Do not assume direct-open mode will support every engine feature.
- ARM64 and x86_64 require separately verified guest execution paths. Host CPU architecture is not guest CPU compatibility.
- Google Play services are proprietary and cannot be recreated merely by implementing similarly named APIs. Treat AOSP operation and licensed/authorized Play support as separate goals.
- Camera, microphone, audio, networking, GPU acceleration, and multi-instance support are milestone features, not assumed capabilities.

## Acceptance gate

The build pipeline and two browser smoke-test pages have been committed, but their generated binaries and guest images still need a successful CI build and browser boot verification. The first completed milestone requires both ARM64 and x86_64 Linux guests to boot in the target browser. The next is a real Android guest boot. Only then should APK installation and execution be marked implemented.

### 5. Android guest candidate: LineageOS virtual machines for QEMU

A stronger Android boot candidate has been identified: `jqssun/android-lineage-qemu`. Its build script targets both `virtio_arm64only` and `virtio_x86_64` on the LineageOS `lineage-24.0` branch, and its releases publish UTM VM archives and OTA packages for both architectures. The documented VM configuration uses QEMU's ARM `virt` machine and x86 `q35` machine, UEFI firmware, qcow2 disks, VirtIO storage/network/display devices, and USB input.

This gives WebDroid a real Android kernel + userspace + virtual hardware target, rather than a generic GSI that still needs a matching vendor implementation. A downloader/inspector workflow has been added to retrieve the latest public ARM64 and x86_64 VM archives without committing multi-gigabyte binaries into Git.

The Android guest is **not integrated or booted yet**. The current QEMU/Wasm build was configured and smoke-tested only for a Raspberry Pi ARM64 Linux guest and an x86_64 Alpine PC guest. The QEMU Wasm build must be checked for the Lineage VM's `virt`/`q35` devices, UEFI/pflash, qcow2, VirtIO GPU, USB, and networking before an Android boot can be attempted.

Sources:
- https://github.com/jqssun/android-lineage-qemu
- https://github.com/jqssun/android-lineage-qemu/releases/latest
- https://www.qemu.org/docs/master/system/target-arm.html
- https://source.android.com/docs/core/tests/vts/gsi


### 6. Browser-only legacy Android alternatives evaluated

Two projects demonstrate useful but narrower browser paths:

- `Z3BOS/afterburner` uses v86 (a JIT x86 emulator) and reports a browser boot test of Android-x86 1.6 through its boot menu, with curated images up to Android-x86 9.0. Its own architecture notes say the browser path has not verified the full graphical home screen for all releases, and v86 lacks the 64-bit CPU features and multicore support needed by newer guests. It is useful as a legacy x86 experiment, but it does not meet WebDroid's latest-Android + ARM64 requirements.
- `nishal21/NekoDroid` is a browser-native ARMv7 Wasm emulator with a constrained Dalvik HLE path. Its own README explicitly says arbitrary Play Store APKs, JNI/native libraries, and full Android userspace (Zygote, Binder, SurfaceFlinger) are not supported. It is not a full Android OS emulator.

These are not selected as the primary engine, but their browser storage, JIT, and APK-loading approaches remain useful references.

Sources:
- https://github.com/Z3BOS/afterburner
- https://github.com/nishal21/NekoDroid

