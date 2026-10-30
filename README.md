# WebDroid

A browser-based Android virtualization research project.

The active project lives in [webdroid/](./webdroid/). It currently contains:
- A browser-openable device-management dashboard
- Local APK file storage (not yet APK installation)
- QEMU/WebAssembly build automation for ARM64 and x86_64 guest targets
- Linux guest smoke-test pages and browser compatibility checks
- Engine research, technical constraints, and an implementation roadmap

**Current limitation:** this is not yet a complete Android emulator. The immediate milestone is to validate both Linux guest boots in Chromium, then bring up a compatible Android guest.

Start with [the WebDroid project guide](./webdroid/README.md).
