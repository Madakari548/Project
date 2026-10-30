# Android guest integration plan

## Selected Android guest candidate

Use the community-built **LineageOS for QEMU Virtual Machines** project as the first real Android guest candidate:

- Repository: https://github.com/jqssun/android-lineage-qemu
- Latest release page: https://github.com/jqssun/android-lineage-qemu/releases/latest
- Source build branch: `lineage-24.0`
- Guest targets: `virtio_arm64only` and `virtio_x86_64`
- Published VM images: `UTM-VM-lineage-*.zip`
- Published OTA packages: `lineage_virtio_arm64only-ota.zip` and `lineage_virtio_x86_64-ota.zip`
- License of the builder repository: GPL-3.0; check the licenses/notices of each guest image and included component before redistribution.

This is a substantially better Android starting point than attempting to boot a generic GSI directly: the project supplies Android VM builds with a matching virtual-device configuration, kernel, recovery, boot images, and writable virtual disks. Its build script currently builds the LineageOS 24.0 branch for both targets.

## Why the current QEMU/Wasm Linux demo cannot boot these images yet

The existing QEMU/Wasm build is configured around two Linux demos:
- ARM64 uses the Raspberry Pi 3A+ machine (`raspi3ap`) and a raw ext4 SD image.
- x86_64 uses a PC machine and an Alpine Linux kernel/initramfs/rootfs.

The LineageOS VM definitions instead require a different machine/device set:
- ARM64: `-machine virt`, UEFI pflash firmware, VirtIO block devices, VirtIO GPU, USB input, VirtIO networking, and two qcow2 disks.
- x86_64: `-machine q35`, UEFI firmware, VirtIO block devices, VirtIO GPU, USB input, and two qcow2 disks.
- Both VM images are configured for approximately 2 GiB guest RAM and expose ADB over the VM network/VirtIO channel.

The QEMU/Wasm build currently has not been verified to include every required device, UEFI firmware path, qcow2 block driver, graphical display backend, or network backend. The Linux smoke tests do not prove any of these.

## Integration gates

1. Retrieve the two published VM archives and inspect their exact file layout, sizes, checksums, firmware, and disk formats. Do not commit multi-gigabyte images to the Git repository.
2. Confirm that the Emscripten QEMU build contains the required `virt`, `q35`, VirtIO block/GPU/network, USB, pflash/UEFI, and qcow2 components.
3. Add an Android-specific QEMU build profile without breaking the Linux smoke-test profiles.
4. First boot one Android target with serial/ADB diagnostics and no claim of a working GUI.
5. Add a browser framebuffer/display adapter and pointer/touch input only after the guest reaches Android userspace.
6. Verify persistent disk writes by rebooting and checking that state remains.
7. Test APK installation with Android's package manager inside the guest, not by storing an APK in IndexedDB.
8. Add guest networking, audio, camera, microphone, and multiple instances one at a time, with browser permission prompts and explicit feature checks.

## Google Play services

The LineageOS VM build is not automatically a Google-certified Play Store emulator. Google Apps packages are separate optional downloads and their licensing/compatibility must be assessed independently. The project must not bundle proprietary Google components or claim Play certification without authorization.

## Resource and browser constraints

The published VM configuration uses 2 GiB of guest RAM before accounting for QEMU, WebAssembly memory, browser tabs, graphics, and storage caches. The current QEMU/Wasm demo allocates 2300 MiB of Emscripten memory, which is not a safe assumption for a 2 GiB Android guest. A larger memory profile must be tested against actual ChromeOS device RAM and browser limits before it is enabled by default.

The current pthread-based QEMU build requires a secure cross-origin-isolated context (COOP/COEP). A local `file://` HTML launch cannot provide those headers or service-worker control. Keep the direct-open dashboard and the full VM launch mode clearly separated.

## References

- LineageOS QEMU VM repository: https://github.com/jqssun/android-lineage-qemu
- QEMU ARM machine selection: https://www.qemu.org/docs/master/system/target-arm.html
- Android GSI architecture and boot requirements: https://source.android.com/docs/core/tests/vts/gsi
- Android partition layout: https://source.android.com/docs/core/architecture/partitions
