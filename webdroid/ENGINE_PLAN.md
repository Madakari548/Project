# WebDroid engine plan

## Non-negotiable product constraints
- Browser execution; no user-operated backend server.
- Prefer a distributable local HTML entry point.
- Target ARM64 and x86_64 guests, but report actual engine support rather than advertising unverified compatibility.
- Persistent local storage and touch, keyboard, pointer, audio, and network adapters.
- Multiple isolated device instances.

## Reality check

A full modern Android environment is not a normal web application. It requires a guest CPU, memory and device model, boot firmware/kernel, Android system images, writable block storage, graphics and input devices, and a bridge between guest devices and browser APIs. A browser sandbox also limits direct access to host camera, microphone, GPU, and network interfaces.

A single HTML file can be a launcher/container, but it cannot conjure a complete Android OS. A standalone offline deliverable would need the compiled emulator runtime and compatible Android images packaged alongside or embedded in the distribution. File-size and browser-memory constraints are substantial.

Google Play services are proprietary Google components. An open-source emulator cannot simply recreate equivalent authenticated Play functionality. The project must distinguish AOSP-compatible operation from licensed Google Play support.

## Milestones

### M0 — Workspace shell (current)
- [x] Browser-openable dashboard
- [x] Device profile UI
- [x] IndexedDB APK archive (storage only; not installation)
- [x] Honest capability/status reporting

### M1 — Engine feasibility spike
- [ ] Compare browser-capable VM/emulator engines and their licenses
- [ ] Verify current Android kernel/system image boot requirements
- [ ] Test ARM64 and x86_64 separately
- [ ] Measure browser memory, startup time, and storage footprint
- [ ] Decide whether direct file:// opening is feasible or whether localhost/HTTPS is required

### M2 — First real guest boot
- [ ] Integrate a selected CPU/VM engine
- [ ] Boot a legally distributable AOSP-derived image
- [ ] Display guest framebuffer
- [ ] Keyboard, pointer and touch input bridge
- [ ] Persistent virtual disk

### M3 — App execution
- [ ] APK parsing and package metadata
- [ ] Guest-side package installation
- [ ] APK execution and lifecycle
- [ ] Audio output and input
- [ ] Network adapter

### M4 — Device and platform features
- [ ] Multiple isolated guest instances
- [ ] Camera and microphone bridge (permission-gated)
- [ ] Snapshot / restore
- [ ] ARM64 and x86_64 compatibility matrix
- [ ] Play-services compatibility assessment; no claim of Google certification without authorization

## Acceptance criteria

A feature is complete only when tested in a real guest OS. UI controls, file selection, or a simulated boot animation do not count as emulator functionality.
