/* Adapted from ktock/qemu-wasm-demo (Apache-2.0). */
var Module = window.Module || {};
(function () {
  const runtimeBase = new URL("../runtime/alpine-x86_64/", document.currentScript.src).href;
  Module["arguments"] = [
    "-nographic", "-M", "pc", "-m", "512M", "-accel", "tcg,tb-size=500",
    "-L", "/pack-rom/",
    "-nic", "none",
    "-kernel", "/pack-kernel/vmlinuz-virt",
    "-initrd", "/pack-initramfs/initramfs-virt",
    "-append", "console=ttyS0 root=/dev/vda noautodetect hostname=webdroid",
    "-drive", "id=test,file=/pack-rootfs/disk-rootfs.img,format=raw,if=none",
    "-device", "virtio-blk-pci,drive=test"
  ];
  Module["locateFile"] = path => new URL(path, runtimeBase).href;
  Module["mainScriptUrlOrBlob"] = runtimeBase + "out.js";
  window.Module = Module;
})();
