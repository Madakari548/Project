/* Adapted from ktock/qemu-wasm-demo (Apache-2.0). */
var Module = window.Module || {};
(function () {
  const runtimeBase = new URL("../runtime/raspi3ap/", document.currentScript.src).href;
  Module["arguments"] = [
    "-nic", "none",
    "-M", "raspi3ap", "-nographic",
    "-m", "512M",
    "-accel", "tcg,tb-size=500", "-smp", "4",
    "-dtb", "/pack/bcm2710-rpi-3-b-plus.dtb",
    "-kernel", "/pack/kernel8.img",
    "-drive", "file=/pack/rootfs.bin,format=raw,if=sd",
    "-append", "earlycon=pl011,0x3f201000 console=ttyAMA0,115200 loglevel=6 initcall_blacklist=bcm2835_pm_driver_init root=/dev/mmcblk0 rootfstype=ext4 rootwait no_console_suspend"
  ];
  Module["locateFile"] = path => new URL(path, runtimeBase).href;
  Module["mainScriptUrlOrBlob"] = runtimeBase + "out.js";
  window.Module = Module;
})();
