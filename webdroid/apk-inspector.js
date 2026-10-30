const decoder = new TextDecoder("utf-8");

function readLength8(view, offset) {
  const first = view.getUint8(offset++);
  if (first & 0x80) return { value: ((first & 0x7f) << 8) | view.getUint8(offset), next: offset + 1 };
  return { value: first, next: offset };
}
function readLength16(view, offset) {
  const first = view.getUint16(offset, true); offset += 2;
  if (first & 0x8000) return { value: ((first & 0x7fff) << 16) | view.getUint16(offset, true), next: offset + 2 };
  return { value: first, next: offset };
}
function parseStringPool(view, start, stringsStart) {
  const count = view.getUint32(start + 8, true);
  const flags = view.getUint32(start + 16, true);
  const utf8 = (flags & 0x100) !== 0;
  const dataStart = start + stringsStart;
  const strings = [];
  for (let i = 0; i < count; i++) {
    let p = start + view.getUint32(start + 28 + i * 4, true);
    if (utf8) {
      let a = readLength8(view, p); p = a.next;
      let b = readLength8(view, p); p = b.next;
      strings.push(decoder.decode(new Uint8Array(view.buffer, view.byteOffset + p, b.value)));
    } else {
      let a = readLength16(view, p); p = a.next;
      strings.push(new TextDecoder("utf-16le").decode(new Uint8Array(view.buffer, view.byteOffset + p, a.value * 2)));
    }
  }
  return strings;
}
function parseBinaryManifest(buffer) {
  const view = new DataView(buffer);
  if (view.byteLength < 8 || view.getUint16(0, true) !== 3) throw new Error("Android binary XMLではありません");
  let strings = [];
  const result = {};
  for (let p = 8; p + 8 <= view.byteLength;) {
    const type = view.getUint16(p, true);
    const headerSize = view.getUint16(p + 2, true);
    const size = view.getUint32(p + 4, true);
    if (size < 8 || p + size > view.byteLength) throw new Error("Manifest chunkが破損しています");
    if (type === 1) {
      const stringsStart = view.getUint32(p + 20, true);
      strings = parseStringPool(view, p, stringsStart);
    } else if (type === 0x0102 && size >= 36) {
      const elementName = strings[view.getUint32(p + 20, true)];
      if (elementName === "manifest") {
        const attrStart = p + 16 + view.getUint16(p + 24, true);
        const attrSize = view.getUint16(p + 26, true);
        const attrCount = view.getUint16(p + 28, true);
        for (let i = 0; i < attrCount; i++) {
          const a = attrStart + i * attrSize;
          const name = strings[view.getUint32(a + 4, true)];
          const raw = view.getUint32(a + 8, true);
          const valueType = view.getUint8(a + 15);
          const data = view.getUint32(a + 16, true);
          let value = raw !== 0xffffffff ? strings[raw] : null;
          if (value === null && valueType === 3) value = strings[data];
          if (value === null && valueType === 0x10) value = String(data);
          if (value === null && valueType === 0x11) value = "0x" + data.toString(16);
          if (name === "package") result.packageName = value;
          if (name === "versionName") result.versionName = value;
          if (name === "versionCode") result.versionCode = value;
          if (name === "label" && value) result.label = value;
        }
        break;
      }
    }
    p += size;
  }
  if (!result.packageName) throw new Error("manifestのpackage属性を読み取れません");
  return result;
}
async function findManifest(file) {
  const tailStart = Math.max(0, file.size - 65557);
  const tailBuffer = await file.slice(tailStart).arrayBuffer();
  const tail = new DataView(tailBuffer);
  let eocd = -1;
  for (let p = tail.byteLength - 22; p >= Math.max(0, tail.byteLength - 65557); p--) {
    if (tail.getUint32(p, true) === 0x06054b50) { eocd = p; break; }
  }
  if (eocd < 0) throw new Error("APK内のZIP目録が見つかりません");
  const entries = tail.getUint16(eocd + 10, true);
  const directorySize = tail.getUint32(eocd + 12, true);
  const directoryOffset = tail.getUint32(eocd + 16, true);
  if (directoryOffset === 0xffffffff || directorySize === 0xffffffff) throw new Error("ZIP64 APKには未対応です");
  const directoryBuffer = await file.slice(directoryOffset, directoryOffset + directorySize).arrayBuffer();
  const directory = new DataView(directoryBuffer);
  let p = 0;
  for (let i = 0; i < entries && p + 46 <= directory.byteLength; i++) {
    if (directory.getUint32(p, true) !== 0x02014b50) throw new Error("ZIP目録が破損しています");
    const method = directory.getUint16(p + 10, true);
    const compressedSize = directory.getUint32(p + 20, true);
    const nameLength = directory.getUint16(p + 28, true);
    const extraLength = directory.getUint16(p + 30, true);
    const commentLength = directory.getUint16(p + 32, true);
    const localOffset = directory.getUint32(p + 42, true);
    const name = decoder.decode(new Uint8Array(directoryBuffer, p + 46, nameLength));
    if (name === "AndroidManifest.xml") {
      const localHeader = new DataView(await file.slice(localOffset, localOffset + 30).arrayBuffer());
      if (localHeader.getUint32(0, true) !== 0x04034b50) throw new Error("ManifestのZIPヘッダーが破損しています");
      const localNameLength = localHeader.getUint16(26, true);
      const localExtraLength = localHeader.getUint16(28, true);
      const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = await file.slice(dataOffset, dataOffset + compressedSize).arrayBuffer();
      let manifest;
      if (method === 0) manifest = compressed;
      else if (method === 8 && typeof DecompressionStream !== "undefined") {
        manifest = await new Response(new Blob([compressed]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer();
      } else throw new Error("APKの圧縮方式に未対応です: " + method);
      return parseBinaryManifest(manifest);
    }
    p += 46 + nameLength + extraLength + commentLength;
  }
  throw new Error("AndroidManifest.xmlが見つかりません");
}
export async function inspectApk(file) {
  let sha256 = null;
  try {
    if (globalThis.crypto?.subtle && file.size <= 128 * 1024 * 1024) {
      const digest = await globalThis.crypto.subtle.digest("SHA-256", await file.arrayBuffer());
      sha256 = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
    }
  } catch { /* file:// contexts may not expose SubtleCrypto */ }
  let manifest = null, manifestError = null;
  try { manifest = await findManifest(file); } catch (error) { manifestError = error.message || String(error); }
  return { sha256, manifest, manifestError };
}
