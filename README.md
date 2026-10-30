# WebDroid

A browser-based Android virtualization research project.

The active project lives in [`webdroid/`](./webdroid/). It currently contains:
- A browser-openable device-management dashboard with IndexedDB-persisted device profiles
- Local APK archive with AndroidManifest package/version inspection, SHA-256 when supported, and export (not installation)
- QEMU/WebAssembly build automation for ARM64 and x86_64 Linux guest smoke tests
- Browser-side networking prototype for the x86_64 Linux guest
- An Android guest acquisition workflow for ARM64 and x86_64 LineageOS QEMU virtual-machine images
- Engine research, technical constraints, and an implementation roadmap

**Current limitation:** WebDroid is not yet a complete Android emulator. Linux guest boot, Android guest boot, APK installation/execution, and Android device I/O must each be verified before being marked complete. Google Play services are not bundled.

Useful links:
- [WebDroid project guide](./webdroid/README.md)
- [Android guest integration plan](./webdroid/ANDROID_GUEST_PLAN.md)
- [QEMU Linux build workflow](https://github.com/Madakari548/Project/actions/workflows/build-qemu-wasm.yml)
- [Android guest image workflow](https://github.com/Madakari548/Project/actions/workflows/android-guest-assets.yml)
- [Static checks](https://github.com/Madakari548/Project/actions/workflows/webdroid-checks.yml)
