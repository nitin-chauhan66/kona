// node_modules/verilator-wasm/dist/index.mjs
var FILETYPE_UNKNOWN = 0;
var FILETYPE_DIRECTORY = 3;
var FILETYPE_REGULAR_FILE = 4;
var ERRNO = {
  SUCCESS: 0,
  EACCES: 2,
  EBADF: 8,
  EEXIST: 20,
  EFAULT: 21,
  EINVAL: 28,
  EISDIR: 31,
  ENOENT: 44,
  ENOSYS: 52,
  ENOTDIR: 54,
  ENOTEMPTY: 55,
  ENOTCAPABLE: 76,
  EPERM: 63,
  ESPIPE: 70
};
var encoder = new TextEncoder();
var decoder = new TextDecoder();
var decodeText = (bytes) => decoder.decode(bytes);
var encodeText = (text) => encoder.encode(text);
var vfsError = (errno, message) => Object.assign(new Error(message || "vfs errno " + errno), { errno, isVfsError: true });
var isVfsError = (err) => Boolean(err && err.isVfsError);
var nowNs = () => BigInt(Date.now()) * 1000000n;
var splitPath = (pathStr) => pathStr.split("/").filter((part) => part.length > 0);
var createVfs = () => {
  let nextIno = 1n;
  const makeDir = (parent, name) => ({
    type: "dir",
    ino: nextIno++,
    name,
    parent,
    entries: /* @__PURE__ */ new Map(),
    atim: nowNs(),
    mtim: nowNs(),
    ctim: nowNs()
  });
  const makeFile = (parent, name) => ({
    type: "file",
    ino: nextIno++,
    name,
    parent,
    data: new Uint8Array(0),
    size: 0,
    atim: nowNs(),
    mtim: nowNs(),
    ctim: nowNs()
  });
  const root = makeDir(null, "");
  const dirty = /* @__PURE__ */ new Set();
  const pathOf = (node, base = root) => {
    const parts = [];
    for (let cursor = node; cursor && cursor !== base; cursor = cursor.parent) {
      parts.unshift(cursor.name);
    }
    return parts.join("/");
  };
  const lookup = (base, pathStr) => {
    let node = pathStr.startsWith("/") ? root : base;
    for (const part of splitPath(pathStr)) {
      if (part === ".") {
        continue;
      }
      if (part === "..") {
        node = node.parent || root;
        continue;
      }
      if (node.type !== "dir") {
        throw vfsError(ERRNO.ENOTDIR, "not a directory: " + pathStr);
      }
      const next = node.entries.get(part);
      if (next === void 0) {
        throw vfsError(ERRNO.ENOENT, "no such file or directory: " + pathStr);
      }
      node = next;
    }
    return node;
  };
  const resolveParent = (base, pathStr) => {
    const parts = splitPath(pathStr);
    if (parts.length === 0) {
      throw vfsError(ERRNO.EINVAL, "empty path");
    }
    const name = parts[parts.length - 1];
    const dirPath = (pathStr.startsWith("/") ? "/" : "") + parts.slice(0, -1).join("/");
    const dir = lookup(base, dirPath || ".");
    if (dir.type !== "dir") {
      throw vfsError(ERRNO.ENOTDIR, "not a directory: " + dirPath);
    }
    if (name === "." || name === "..") {
      throw vfsError(ERRNO.EINVAL, "invalid final component: " + pathStr);
    }
    return { dir, name };
  };
  const mkdir = (base, pathStr) => {
    const { dir, name } = resolveParent(base, pathStr);
    if (dir.entries.has(name)) {
      throw vfsError(ERRNO.EEXIST, "exists: " + pathStr);
    }
    const node = makeDir(dir, name);
    dir.entries.set(name, node);
    dir.mtim = nowNs();
    return node;
  };
  const mkdirp = (base, pathStr) => {
    let node = pathStr.startsWith("/") ? root : base;
    for (const part of splitPath(pathStr)) {
      if (part === ".") {
        continue;
      }
      if (part === "..") {
        node = node.parent || root;
        continue;
      }
      const existing = node.entries.get(part);
      if (existing === void 0) {
        const created = makeDir(node, part);
        node.entries.set(part, created);
        node = created;
      } else if (existing.type === "dir") {
        node = existing;
      } else {
        throw vfsError(ERRNO.ENOTDIR, "not a directory: " + pathStr);
      }
    }
    return node;
  };
  const createFile = (base, pathStr, { exclusive = false } = {}) => {
    const { dir, name } = resolveParent(base, pathStr);
    const existing = dir.entries.get(name);
    if (existing !== void 0) {
      if (exclusive) {
        throw vfsError(ERRNO.EEXIST, "exists: " + pathStr);
      }
      if (existing.type !== "file") {
        throw vfsError(ERRNO.EISDIR, "is a directory: " + pathStr);
      }
      return existing;
    }
    const node = makeFile(dir, name);
    dir.entries.set(name, node);
    dir.mtim = nowNs();
    dirty.add(node);
    return node;
  };
  const unlink = (base, pathStr) => {
    const { dir, name } = resolveParent(base, pathStr);
    const node = dir.entries.get(name);
    if (node === void 0) {
      throw vfsError(ERRNO.ENOENT, "no such file: " + pathStr);
    }
    if (node.type === "dir" && node.entries.size > 0) {
      throw vfsError(ERRNO.ENOTEMPTY, "not empty: " + pathStr);
    }
    dir.entries.delete(name);
    dir.mtim = nowNs();
    dirty.delete(node);
  };
  const truncate = (node) => {
    node.data = new Uint8Array(0);
    node.size = 0;
    node.mtim = nowNs();
    dirty.add(node);
  };
  const write = (node, offset, bytes) => {
    const end = offset + bytes.length;
    if (end > node.data.length) {
      const capacity = Math.max(end, node.data.length * 2, 1024);
      const grown = new Uint8Array(capacity);
      grown.set(node.data.subarray(0, node.size));
      node.data = grown;
    }
    node.data.set(bytes, offset);
    node.size = Math.max(node.size, end);
    node.mtim = nowNs();
    dirty.add(node);
    return bytes.length;
  };
  const read = (node, offset, length) => {
    if (offset >= node.size) {
      return new Uint8Array(0);
    }
    return node.data.subarray(offset, Math.min(node.size, offset + length));
  };
  const setTimes = (node, atim, mtim) => {
    if (atim !== null) {
      node.atim = atim;
    }
    if (mtim !== null) {
      node.mtim = mtim;
    }
  };
  const filetype = (node) => {
    if (node.type === "dir") {
      return FILETYPE_DIRECTORY;
    }
    if (node.type === "file") {
      return FILETYPE_REGULAR_FILE;
    }
    return FILETYPE_UNKNOWN;
  };
  const readdir = (node) => {
    if (node.type !== "dir") {
      throw vfsError(ERRNO.ENOTDIR, "not a directory");
    }
    const entries = [
      { name: ".", node },
      { name: "..", node: node.parent || node }
    ];
    for (const [name, child] of node.entries) {
      entries.push({ name, node: child });
    }
    return entries;
  };
  const writeFile = (base, pathStr, contents) => {
    const parts = splitPath(pathStr);
    if (parts.length > 1) {
      mkdirp(base, parts.slice(0, -1).join("/"));
    }
    const node = createFile(base, pathStr);
    const bytes = typeof contents === "string" ? encodeText(contents) : new Uint8Array(contents);
    node.data = bytes;
    node.size = bytes.length;
    node.mtim = nowNs();
    dirty.add(node);
    return node;
  };
  const readFile = (base, pathStr) => {
    const node = lookup(base, pathStr);
    if (node.type !== "file") {
      throw vfsError(ERRNO.EISDIR, "is a directory: " + pathStr);
    }
    return node.data.subarray(0, node.size);
  };
  const markClean = () => dirty.clear();
  const dirtyFiles = (base = root, { exclude = [] } = {}) => {
    const out = {};
    for (const node of dirty) {
      if (node.type !== "file") {
        continue;
      }
      const key = pathOf(node, base);
      if (key === "" || exclude.some((prefix) => key === prefix || key.startsWith(prefix + "/"))) {
        continue;
      }
      out[key] = node.data.subarray(0, node.size);
    }
    return out;
  };
  return {
    root,
    pathOf,
    lookup,
    resolveParent,
    mkdir,
    mkdirp,
    createFile,
    unlink,
    truncate,
    write,
    read,
    setTimes,
    filetype,
    readdir,
    writeFile,
    readFile,
    markClean,
    dirtyFiles
  };
};
var FILETYPE_CHARACTER_DEVICE = 2;
var O_CREAT = 1;
var O_DIRECTORY = 2;
var O_EXCL = 4;
var O_TRUNC = 8;
var FILESTAT_SET_ATIM = 1;
var FILESTAT_SET_ATIM_NOW = 2;
var FILESTAT_SET_MTIM = 4;
var FILESTAT_SET_MTIM_NOW = 8;
var WHENCE_SET = 0;
var WHENCE_CUR = 1;
var WHENCE_END = 2;
var RIGHTS_ALL = (1n << 64n) - 1n;
var FD_STDIN = 0;
var FD_STDOUT = 1;
var FD_STDERR = 2;
var FD_PREOPEN = 3;
var DIRENT_SIZE = 24;
var exitSentinel = (code) => Object.assign(new Error("wasi proc_exit(" + code + ")"), { exitCode: code, isExitSentinel: true });
var isExitSentinel = (err) => Boolean(err && err.isExitSentinel);
var concat = (chunks) => {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(total);
  let cursor = 0;
  for (const chunk of chunks) {
    out.set(chunk, cursor);
    cursor += chunk.length;
  }
  return out;
};
var defaultRandom = (target) => {
  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.getRandomValues) {
    for (let offset = 0; offset < target.length; offset += 65536) {
      globalThis.crypto.getRandomValues(target.subarray(offset, Math.min(target.length, offset + 65536)));
    }
    return;
  }
  for (let i = 0; i < target.length; i++) {
    target[i] = Math.floor(Math.random() * 256);
  }
};
var createWasi = ({
  vfs,
  mountNode,
  mountName = "/",
  args = [],
  env = {},
  onStdout = null,
  onStderr = null,
  now = () => Date.now(),
  random = defaultRandom
}) => {
  const mount = mountNode || vfs.root;
  const stdoutChunks = [];
  const stderrChunks = [];
  const fds = /* @__PURE__ */ new Map([
    [FD_STDIN, { kind: "stdin" }],
    [FD_STDOUT, { kind: "stdout" }],
    [FD_STDERR, { kind: "stderr" }],
    [FD_PREOPEN, { kind: "dir", node: mount, preopen: mountName, offset: 0 }]
  ]);
  let nextFd = FD_PREOPEN + 1;
  let memory = null;
  let exitCode = null;
  const view = () => new DataView(memory.buffer);
  const bytes = () => new Uint8Array(memory.buffer);
  const readString = (ptr, len) => decodeText(bytes().subarray(ptr, ptr + len));
  const getFd = (fd) => {
    const entry = fds.get(fd);
    if (entry === void 0) {
      throw Object.assign(new Error("bad fd " + fd), { errno: ERRNO.EBADF, isVfsError: true });
    }
    return entry;
  };
  const getDirNode = (fd) => {
    const entry = getFd(fd);
    if (entry.kind !== "dir") {
      throw Object.assign(
        new Error("fd " + fd + " is not a directory"),
        { errno: ERRNO.ENOTDIR, isVfsError: true }
      );
    }
    return entry.node;
  };
  const readIovs = (ptr, count) => {
    const dv = view();
    const mem = bytes();
    const out = [];
    for (let i = 0; i < count; i++) {
      const base = dv.getUint32(ptr + i * 8, true);
      const len = dv.getUint32(ptr + i * 8 + 4, true);
      out.push(mem.subarray(base, base + len));
    }
    return out;
  };
  const writeStd = (kind, iovs, nwrittenPtr) => {
    let total = 0;
    for (const chunk of iovs) {
      if (chunk.length === 0) {
        continue;
      }
      const copy = chunk.slice();
      total += copy.length;
      if (kind === "stdout") {
        stdoutChunks.push(copy);
        if (onStdout) {
          onStdout(decodeText(copy));
        }
      } else {
        stderrChunks.push(copy);
        if (onStderr) {
          onStderr(decodeText(copy));
        }
      }
    }
    view().setUint32(nwrittenPtr, total, true);
    return ERRNO.SUCCESS;
  };
  const wrap = (fn) => (...callArgs) => {
    for (let i = 0; i < callArgs.length; i++) {
      if (typeof callArgs[i] === "number") callArgs[i] >>>= 0;
    }
    try {
      return fn(...callArgs);
    } catch (err) {
      if (isExitSentinel(err)) {
        throw err;
      }
      if (isVfsError(err)) {
        return err.errno;
      }
      if (err instanceof RangeError || err instanceof TypeError) {
        return ERRNO.EFAULT;
      }
      throw err;
    }
  };
  const encodeStrings = (list) => {
    const encoded = list.map((s) => encodeText(s + "\0"));
    return { encoded, bufSize: encoded.reduce((sum, b) => sum + b.length, 0) };
  };
  const putStrings = (list, ptrArrayPtr, bufPtr) => {
    const dv = view();
    const mem = bytes();
    let cursor = bufPtr;
    encodeStrings(list).encoded.forEach((entry, index) => {
      dv.setUint32(ptrArrayPtr + index * 4, cursor, true);
      mem.set(entry, cursor);
      cursor += entry.length;
    });
    return ERRNO.SUCCESS;
  };
  const putSizes = (list, countPtr, bufSizePtr) => {
    const { encoded, bufSize } = encodeStrings(list);
    const dv = view();
    dv.setUint32(countPtr, encoded.length, true);
    dv.setUint32(bufSizePtr, bufSize, true);
    return ERRNO.SUCCESS;
  };
  const envStrings = () => Object.entries(env).map(([key, value]) => key + "=" + value);
  const writeFilestat = (ptr, node) => {
    const dv = view();
    dv.setBigUint64(ptr, 0n, true);
    dv.setBigUint64(ptr + 8, node.ino, true);
    dv.setUint8(ptr + 16, vfs.filetype(node));
    dv.setBigUint64(ptr + 24, 1n, true);
    dv.setBigUint64(ptr + 32, BigInt(node.type === "file" ? node.size : 0), true);
    dv.setBigUint64(ptr + 40, node.atim, true);
    dv.setBigUint64(ptr + 48, node.mtim, true);
    dv.setBigUint64(ptr + 56, node.ctim, true);
  };
  const writeFdstat = (ptr, filetype, fdflags) => {
    const dv = view();
    dv.setUint8(ptr, filetype);
    dv.setUint16(ptr + 2, fdflags, true);
    dv.setBigUint64(ptr + 8, RIGHTS_ALL, true);
    dv.setBigUint64(ptr + 16, RIGHTS_ALL, true);
  };
  const importObject = {
    wasi_snapshot_preview1: {
      args_sizes_get: wrap((countPtr, bufSizePtr) => putSizes(args, countPtr, bufSizePtr)),
      args_get: wrap((ptrArrayPtr, bufPtr) => putStrings(args, ptrArrayPtr, bufPtr)),
      environ_sizes_get: wrap((countPtr, bufSizePtr) => putSizes(envStrings(), countPtr, bufSizePtr)),
      environ_get: wrap((ptrArrayPtr, bufPtr) => putStrings(envStrings(), ptrArrayPtr, bufPtr)),
      clock_time_get: wrap((id, precision, timePtr) => {
        view().setBigUint64(timePtr, BigInt(Math.round(now() * 1e6)), true);
        return ERRNO.SUCCESS;
      }),
      poll_oneoff: wrap(() => ERRNO.ENOSYS),
      sched_yield: wrap(() => ERRNO.SUCCESS),
      fd_fdstat_set_flags: wrap((fd, flags) => {
        getFd(fd).fdflags = flags;
        return ERRNO.SUCCESS;
      }),
      random_get: wrap((bufPtr, len) => {
        random(bytes().subarray(bufPtr, bufPtr + len));
        return ERRNO.SUCCESS;
      }),
      proc_exit: (code) => {
        throw exitSentinel(code);
      },
      fd_close: wrap((fd) => {
        if (fd <= FD_PREOPEN) {
          return ERRNO.SUCCESS;
        }
        getFd(fd);
        fds.delete(fd);
        return ERRNO.SUCCESS;
      }),
      fd_fdstat_get: wrap((fd, statPtr) => {
        const entry = getFd(fd);
        if (entry.kind === "stdin" || entry.kind === "stdout" || entry.kind === "stderr") {
          writeFdstat(statPtr, FILETYPE_CHARACTER_DEVICE, 0);
          return ERRNO.SUCCESS;
        }
        writeFdstat(statPtr, vfs.filetype(entry.node), entry.fdflags || 0);
        return ERRNO.SUCCESS;
      }),
      fd_prestat_get: wrap((fd, prestatPtr) => {
        const entry = getFd(fd);
        if (entry.preopen === void 0) {
          return ERRNO.EBADF;
        }
        const dv = view();
        dv.setUint32(prestatPtr, 0, true);
        dv.setUint32(prestatPtr + 4, encodeText(entry.preopen).length, true);
        return ERRNO.SUCCESS;
      }),
      fd_prestat_dir_name: wrap((fd, pathPtr, pathLen) => {
        const entry = getFd(fd);
        if (entry.preopen === void 0) {
          return ERRNO.EBADF;
        }
        const name = encodeText(entry.preopen);
        if (name.length > pathLen) {
          return ERRNO.ENOTCAPABLE;
        }
        bytes().set(name, pathPtr);
        return ERRNO.SUCCESS;
      }),
      fd_write: wrap((fd, iovsPtr, iovsLen, nwrittenPtr) => {
        const entry = getFd(fd);
        const iovs = readIovs(iovsPtr, iovsLen);
        if (entry.kind === "stdout" || entry.kind === "stderr") {
          return writeStd(entry.kind, iovs, nwrittenPtr);
        }
        if (entry.kind !== "file") {
          return ERRNO.EISDIR;
        }
        let written = 0;
        for (const chunk of iovs) {
          written += vfs.write(entry.node, entry.offset + written, chunk);
        }
        entry.offset += written;
        view().setUint32(nwrittenPtr, written, true);
        return ERRNO.SUCCESS;
      }),
      fd_read: wrap((fd, iovsPtr, iovsLen, nreadPtr) => {
        const entry = getFd(fd);
        if (entry.kind === "stdin") {
          view().setUint32(nreadPtr, 0, true);
          return ERRNO.SUCCESS;
        }
        if (entry.kind !== "file") {
          return ERRNO.EISDIR;
        }
        let read = 0;
        for (const target of readIovs(iovsPtr, iovsLen)) {
          const chunk = vfs.read(entry.node, entry.offset + read, target.length);
          if (chunk.length === 0) {
            break;
          }
          target.set(chunk);
          read += chunk.length;
        }
        entry.offset += read;
        view().setUint32(nreadPtr, read, true);
        return ERRNO.SUCCESS;
      }),
      fd_seek: wrap((fd, offset, whence, newOffsetPtr) => {
        const entry = getFd(fd);
        if (entry.kind !== "file") {
          return ERRNO.ESPIPE;
        }
        const delta = Number(offset);
        let next;
        switch (whence) {
          case WHENCE_SET:
            next = delta;
            break;
          case WHENCE_CUR:
            next = entry.offset + delta;
            break;
          case WHENCE_END:
            next = entry.node.size + delta;
            break;
          default:
            return ERRNO.EINVAL;
        }
        if (next < 0) {
          return ERRNO.EINVAL;
        }
        entry.offset = next;
        view().setBigUint64(newOffsetPtr, BigInt(next), true);
        return ERRNO.SUCCESS;
      }),
      fd_readdir: wrap((fd, bufPtr, bufLen, cookie, bufUsedPtr) => {
        const entries = vfs.readdir(getDirNode(fd));
        const dv = view();
        const mem = bytes();
        let used = 0;
        const header = new Uint8Array(DIRENT_SIZE);
        const hv = new DataView(header.buffer);
        for (let index = Number(cookie); index < entries.length && used < bufLen; index++) {
          const entry = entries[index];
          const name = encodeText(entry.name);
          hv.setBigUint64(0, BigInt(index + 1), true);
          hv.setBigUint64(8, entry.node.ino, true);
          hv.setUint32(16, name.length, true);
          hv.setUint8(20, vfs.filetype(entry.node));
          const headRoom = Math.min(DIRENT_SIZE, bufLen - used);
          mem.set(header.subarray(0, headRoom), bufPtr + used);
          used += headRoom;
          const nameRoom = Math.min(name.length, bufLen - used);
          mem.set(name.subarray(0, nameRoom), bufPtr + used);
          used += nameRoom;
        }
        dv.setUint32(bufUsedPtr, used, true);
        return ERRNO.SUCCESS;
      }),
      path_open: wrap((dirFd, dirFlags, pathPtr, pathLen, oflags, rightsBase, rightsInheriting, fdflags, openedFdPtr) => {
        const base = getDirNode(dirFd);
        const pathStr = readString(pathPtr, pathLen);
        const node = oflags & O_CREAT ? vfs.createFile(base, pathStr, { exclusive: Boolean(oflags & O_EXCL) }) : vfs.lookup(base, pathStr);
        if (oflags & O_DIRECTORY && node.type !== "dir") {
          return ERRNO.ENOTDIR;
        }
        if (node.type === "file" && oflags & O_TRUNC) {
          vfs.truncate(node);
        }
        const fd = nextFd++;
        fds.set(fd, {
          kind: node.type === "dir" ? "dir" : "file",
          node,
          offset: 0,
          fdflags
        });
        view().setUint32(openedFdPtr, fd, true);
        return ERRNO.SUCCESS;
      }),
      path_create_directory: wrap((dirFd, pathPtr, pathLen) => {
        vfs.mkdir(getDirNode(dirFd), readString(pathPtr, pathLen));
        return ERRNO.SUCCESS;
      }),
      path_unlink_file: wrap((dirFd, pathPtr, pathLen) => {
        vfs.unlink(getDirNode(dirFd), readString(pathPtr, pathLen));
        return ERRNO.SUCCESS;
      }),
      path_filestat_get: wrap((dirFd, flags, pathPtr, pathLen, statPtr) => {
        const node = vfs.lookup(getDirNode(dirFd), readString(pathPtr, pathLen));
        writeFilestat(statPtr, node);
        return ERRNO.SUCCESS;
      }),
      path_filestat_set_times: wrap((dirFd, flags, pathPtr, pathLen, atim, mtim, fstFlags) => {
        const node = vfs.lookup(getDirNode(dirFd), readString(pathPtr, pathLen));
        const nowValue = BigInt(Math.round(now() * 1e6));
        vfs.setTimes(
          node,
          fstFlags & FILESTAT_SET_ATIM ? atim : fstFlags & FILESTAT_SET_ATIM_NOW ? nowValue : null,
          fstFlags & FILESTAT_SET_MTIM ? mtim : fstFlags & FILESTAT_SET_MTIM_NOW ? nowValue : null
        );
        return ERRNO.SUCCESS;
      }),
      // The VFS has no symlinks. realpath() degrades to the input path, which is
      // already the observed behaviour of the proven build: meta.json differs
      // from native only in its realpath strings.
      path_readlink: wrap(() => ERRNO.EINVAL)
    }
  };
  const start = (instance) => {
    memory = instance.exports.memory;
    if (!memory) {
      throw new Error("wasi: module exports no memory");
    }
    try {
      instance.exports._start();
      exitCode = 0;
    } catch (err) {
      if (isExitSentinel(err)) {
        exitCode = err.exitCode;
      } else {
        throw err;
      }
    }
    return exitCode;
  };
  return {
    importObject,
    start,
    stdout: () => decodeText(concat(stdoutChunks)),
    stderr: () => decodeText(concat(stderrChunks))
  };
};
var vrootFilesBase64 = {
  "include/verilated_std.sv": "Ly8gREVTQ1JJUFRJT046IFZlcmlsYXRvcjogYnVpbHQtaW4gcGFja2FnZXMgYW5kIGNsYXNzZXMKLy8KLy8gQ29kZSBhdmFpbGFibGUgZnJvbTogaHR0cHM6Ly92ZXJpbGF0b3Iub3JnCi8vCi8vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKgovLwovLyBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTsgeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdAovLyB1bmRlciB0aGUgdGVybXMgb2YgZWl0aGVyIHRoZSBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgVmVyc2lvbiAzCi8vIG9yIHRoZSBQZXJsIEFydGlzdGljIExpY2Vuc2UgVmVyc2lvbiAyLjAuCi8vIFNQRFgtRmlsZUNvcHlyaWdodFRleHQ6IDIwMjItMjAyNiBXaWxzb24gU255ZGVyCi8vIFNQRFgtTGljZW5zZS1JZGVudGlmaWVyOiBMR1BMLTMuMC1vbmx5IE9SIEFydGlzdGljLTIuMAovLwovLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioKLy8vCi8vLyBcZmlsZQovLy8gXGJyaWVmIFZlcmlsYXRlZCBJRUVFIHN0ZDo6IGhlYWRlcgovLy8KLy8vIFRoaXMgZmlsZSBpcyBpbmNsdWRlZCBhdXRvbWF0aWNhbGx5IGJ5IFZlcmlsYXRvciwgdW5sZXNzICctLW5vLXN0ZC1wYWNrYWdlJwovLy8gaXMgdXNlZC4KLy8vCi8vLyBUaGlzIGZpbGUgaXMgbm90IHBhcnQgb2YgdGhlIFZlcmlsYXRlZCBwdWJsaWMtZmFjaW5nIEFQSS4KLy8vIEl0IGlzIG9ubHkgZm9yIGludGVybmFsIHVzZS4KLy8vCi8vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKgovLwovLyBUaGUgZm9sbG93aW5nIGtleXdvcmRzIGZyb20gdGhpcyBmaWxlIGFyZSBoYXJkY29kZWQgZm9yIGRldGVjdGlvbiBpbiB0aGUgcGFyc2VyOgovLyAibWFpbGJveCIsICJwcm9jZXNzIiwgInJhbmRvbWl6ZSIsICJzZW1hcGhvcmUiLCAic3RkIgoKYGlmbmRlZiBWRVJJTEFUT1JfU1REX1NWXwpgZGVmaW5lIFZFUklMQVRPUl9TVERfU1ZfCgovLyB2ZXJpbGF0b3IgbGludF9vZmYgREVDTEZJTEVOQU1FCi8vIHZlcmlsYXRvciBsaW50X29mZiBUSU1FU0NBTEVNT0QKLy8gdmVyaWxhdG9yIGxpbnRfb2ZmIFVOVVNFRFNJR05BTApwYWNrYWdlIHN0ZDsKICAvLyBJRUVFIDE4MDAtc3BlY2lmaWVkIHN0YW5kYXJkICJtYWlsYm94IgogIGNsYXNzIG1haWxib3ggIygKICAgICAgdHlwZSBUCiAgKTsKICAgIHByb3RlY3RlZCBpbnQgbV9ib3VuZDsKICAgIHByb3RlY3RlZCBUIG1fcXVldWVbJF07CgogICAgZnVuY3Rpb24gbmV3KGludCBib3VuZCA9IDApOwogICAgICBtX2JvdW5kID0gYm91bmQ7CiAgICBlbmRmdW5jdGlvbgoKICAgIGZ1bmN0aW9uIGludCBudW0oKTsKICAgICAgcmV0dXJuIG1fcXVldWUuc2l6ZSgpOwogICAgZW5kZnVuY3Rpb24KCiAgICB0YXNrIHB1dChUIG1lc3NhZ2UpOwpgaWZkZWYgVkVSSUxBVE9SX1RJTUlORwogICAgICB3aGlsZSAobV9ib3VuZCAhPSAwICYmIG1fcXVldWUuc2l6ZSgpID49IG1fYm91bmQpICAvLwogICAgICAgIHdhaXQgKG1fcXVldWUuc2l6ZSgpIDwgbV9ib3VuZCk7CiAgICAgIG1fcXVldWUucHVzaF9iYWNrKG1lc3NhZ2UpOwpgZW5kaWYKICAgIGVuZHRhc2sKCiAgICBmdW5jdGlvbiBpbnQgdHJ5X3B1dChUIG1lc3NhZ2UpOwogICAgICBpZiAobV9ib3VuZCA9PSAwIHx8IG51bSgpIDwgbV9ib3VuZCkgYmVnaW4KICAgICAgICBtX3F1ZXVlLnB1c2hfYmFjayhtZXNzYWdlKTsKICAgICAgICByZXR1cm4gMTsKICAgICAgZW5kCiAgICAgIHJldHVybiAwOwogICAgZW5kZnVuY3Rpb24KCiAgICB0YXNrIGdldChyZWYgVCBtZXNzYWdlKTsKYGlmZGVmIFZFUklMQVRPUl9USU1JTkcKICAgICAgd2hpbGUgKG1fcXVldWUuc2l6ZSgpID09IDApIGJlZ2luCiAgICAgICAgd2FpdCAobV9xdWV1ZS5zaXplKCkgPiAwKTsKICAgICAgZW5kCiAgICAgIG1lc3NhZ2UgPSBtX3F1ZXVlLnBvcF9mcm9udCgpOwpgZW5kaWYKICAgIGVuZHRhc2sKCiAgICBmdW5jdGlvbiBpbnQgdHJ5X2dldChyZWYgVCBtZXNzYWdlKTsKICAgICAgaWYgKG51bSgpID4gMCkgYmVnaW4KICAgICAgICBtZXNzYWdlID0gbV9xdWV1ZS5wb3BfZnJvbnQoKTsKICAgICAgICByZXR1cm4gMTsKICAgICAgZW5kCiAgICAgIHJldHVybiAwOwogICAgZW5kZnVuY3Rpb24KCiAgICB0YXNrIHBlZWsocmVmIFQgbWVzc2FnZSk7CmBpZmRlZiBWRVJJTEFUT1JfVElNSU5HCiAgICAgIHdoaWxlIChtX3F1ZXVlLnNpemUoKSA9PSAwKSBiZWdpbgogICAgICAgIHdhaXQgKG1fcXVldWUuc2l6ZSgpID4gMCk7CiAgICAgIGVuZAogICAgICBtZXNzYWdlID0gbV9xdWV1ZVswXTsKYGVuZGlmCiAgICBlbmR0YXNrCgogICAgZnVuY3Rpb24gaW50IHRyeV9wZWVrKHJlZiBUIG1lc3NhZ2UpOwogICAgICBpZiAobnVtKCkgPiAwKSBiZWdpbgogICAgICAgIG1lc3NhZ2UgPSBtX3F1ZXVlWzBdOwogICAgICAgIHJldHVybiAxOwogICAgICBlbmQKICAgICAgcmV0dXJuIDA7CiAgICBlbmRmdW5jdGlvbgogIGVuZGNsYXNzCgogIC8vIElFRUUgMTgwMC1zcGVjaWZpZWQgc3RhbmRhcmQgInByb2Nlc3MiCiAgY2xhc3MgcHJvY2VzczsKICAgIHR5cGVkZWYgZW51bSB7CiAgICAgIEZJTklTSEVEID0gMCwKICAgICAgUlVOTklORyA9IDEsCiAgICAgIFdBSVRJTkcgPSAyLAogICAgICBTVVNQRU5ERUQgPSAzLAogICAgICBLSUxMRUQgPSA0CiAgICB9IHN0YXRlOwoKICAgIC8vIFdpZHRoIHZpc2l0b3IgY2hhbmdlcyBpdCB0byBWbFByb2Nlc3NSZWYKICAgIC8vIFYzTmFtZSBpcyBoYXJkY29kZWQgbm90IHRvIHJlbmFtZSB0aGlzIHZhcmlhYmxlCiAgICBwcm90ZWN0ZWQgY2hhbmRsZSBtX3Byb2Nlc3M7CgogICAgc3RhdGljIGZ1bmN0aW9uIHByb2Nlc3Mgc2VsZigpOwogICAgICBwcm9jZXNzIHA7CmBpZmRlZiBWRVJJTEFUT1JfVElNSU5HCiAgICAgICRjKCJ2bFByb2Nlc3MtPmluaXRGcm9tU2VsZigiLCBwLCAiKTsiKTsKICAgICAgaWYgKHAgPT0gbnVsbCkgYmVnaW4KICAgICAgICBwID0gbmV3OwogICAgICAgICRjKHAubV9wcm9jZXNzLCAiID0gdmxQcm9jZXNzOyIpOwogICAgICAgICRjKCJ2bFByb2Nlc3MtPnNldFNlbGYoJioiLCBwLCAiKTsiKTsKICAgICAgZW5kCmBlbHNlCiAgICAgIHAgPSBuZXc7CmBlbmRpZgogICAgICByZXR1cm4gcDsKICAgIGVuZGZ1bmN0aW9uCgogICAgcHJvdGVjdGVkIGZ1bmN0aW9uIHZvaWQgc2V0X3N0YXR1cyhzdGF0ZSBzKTsKYGlmZGVmIFZFUklMQVRPUl9USU1JTkcKICAgICAgJGMobV9wcm9jZXNzLCAiLT5zdGF0ZSgiLCBzLCAiKTsiKTsKYGVuZGlmCiAgICBlbmRmdW5jdGlvbgoKICAgIGZ1bmN0aW9uIHN0YXRlIHN0YXR1cygpOwpgaWZkZWYgVkVSSUxBVE9SX1RJTUlORwogICAgICByZXR1cm4gc3RhdGUnKCRjcHVyZShtX3Byb2Nlc3MsICItPnN0YXRlKCkiKSk7CmBlbHNlCiAgICAgIHJldHVybiBSVU5OSU5HOwpgZW5kaWYKICAgIGVuZGZ1bmN0aW9uCgogICAgZnVuY3Rpb24gdm9pZCBraWxsKCk7CmBpZmRlZiBWRVJJTEFUT1JfVElNSU5HCiAgICAgIC8vIElFRUUgMTgwMC0yMDIzIDkuNzoga2lsbCgpIHRlcm1pbmF0ZXMgdGhlIHByb2Nlc3MgYW5kIGFsbCBpdHMgZGVzY2VuZGFudHMKICAgICAgJGMobV9wcm9jZXNzLCAiLT5kaXNhYmxlKCk7Iik7CmBlbmRpZgogICAgZW5kZnVuY3Rpb24KCiAgICBmdW5jdGlvbiB2b2lkIHN1c3BlbmQoKTsKICAgICAgJGVycm9yKCJzdGQ6OnByb2Nlc3M6OnN1c3BlbmQoKSBub3Qgc3VwcG9ydGVkIik7CiAgICBlbmRmdW5jdGlvbgoKICAgIGZ1bmN0aW9uIHZvaWQgcmVzdW1lKCk7CiAgICAgIHNldF9zdGF0dXMoUlVOTklORyk7CiAgICBlbmRmdW5jdGlvbgoKICAgIHRhc2sgYXdhaXQoKTsKYGlmZGVmIFZFUklMQVRPUl9USU1JTkcKICAgICAgd2FpdCAoc3RhdHVzKCkgPT0gRklOSVNIRUQgfHwgc3RhdHVzKCkgPT0gS0lMTEVEKTsKYGVuZGlmCiAgICBlbmR0YXNrCgogICAgc3RhdGljIHRhc2sga2lsbFF1ZXVlKHJlZiBwcm9jZXNzIHByb2Nlc3NRdWV1ZVskXSk7CmBpZmRlZiBWRVJJTEFUT1JfVElNSU5HCiAgICAgIHJlcGVhdCAocHJvY2Vzc1F1ZXVlLnNpemUoKSkgYmVnaW4KICAgICAgICBwcm9jZXNzIHAgPSBwcm9jZXNzUXVldWUucG9wX2Zyb250KCk7CiAgICAgICAgaWYgKHApIHAua2lsbCgpOwogICAgICBlbmQKYGVuZGlmCiAgICBlbmR0YXNrCgogICAgLy8gdmVyaWxvZ19mb3JtYXQ6IG9mZgpgaWZkZWYgVkVSSUxBVE9SX1RJTUlORwpgc3lzdGVtY19kdG9yCiAgICBpZiAobV9wcm9jZXNzKSBtX3Byb2Nlc3MtPmNsZWFyU2VsZih0aGlzKTsKYHZlcmlsb2cKYGVuZGlmCiAgICAvLyB2ZXJpbG9nX2Zvcm1hdDogb24KCiAgICBmdW5jdGlvbiBzdHJpbmcgZ2V0X3JhbmRzdGF0ZSgpOwogICAgICAvLyBJbml0aWFsaXplIHdpdGggJGMgdG8gZW5zdXJlIGl0IHdvbid0IGJlIGNvbnN0aWZpZWQKICAgICAgc3RyaW5nIHMgPSBzdHJpbmcnKCRjKCIwIikpOwoKICAgICAgJGMocywgIiA9ICIsIG1fcHJvY2VzcywgIi0+cmFuZHN0YXRlKCk7Iik7CiAgICAgIHJldHVybiBzOwogICAgZW5kZnVuY3Rpb24KCiAgICBmdW5jdGlvbiB2b2lkIHNldF9yYW5kc3RhdGUoc3RyaW5nIHMpOwogICAgICAkYyhtX3Byb2Nlc3MsICItPnJhbmRzdGF0ZSgiLCBzLCAiKTsiKTsKICAgIGVuZGZ1bmN0aW9uCiAgZW5kY2xhc3MKCiAgLy8gSUVFRSAxODAwLXNwZWNpZmllZCBzdGFuZGFyZCAic2VtYXBob3JlIgogIGNsYXNzIHNlbWFwaG9yZTsKICAgIHR5cGVkZWYgc3RydWN0IHsKICAgICAgcHJvY2VzcyBwcm9jOwogICAgICBpbnQgcmVxS2V5czsKICAgIH0gcHJvY0tleXM7CiAgICBwcm9jS2V5cyBtX3F1ZXVlWyRdOwogICAgcHJvdGVjdGVkIGludCBtX2tleUNvdW50OwoKICAgIGxvY2FsIHRhc2sgZHJvcEtpbGxlZDsKICAgICAgLy8gRHJvcCBraWxsZWQgcHJvY2Vzc2VzIGZyb20gdGhlIHF1ZXVlCmBpZmRlZiBWRVJJTEFUT1JfVElNSU5HCiAgICAgIHdoaWxlIChtX3F1ZXVlLnNpemUoKSA+IDAgJiYgbV9xdWV1ZVswXS5wcm9jLnN0YXR1cygpID09IHByb2Nlc3M6OktJTExFRCkgbV9xdWV1ZS5wb3BfZnJvbnQoKTsKYGVuZGlmCiAgICBlbmR0YXNrCiAgICBmdW5jdGlvbiBuZXcoaW50IGtleUNvdW50ID0gMCk7CiAgICAgIG1fa2V5Q291bnQgPSBrZXlDb3VudDsKICAgIGVuZGZ1bmN0aW9uCgogICAgZnVuY3Rpb24gdm9pZCBwdXQoaW50IGtleUNvdW50ID0gMSk7CiAgICAgIG1fa2V5Q291bnQgKz0ga2V5Q291bnQ7CiAgICBlbmRmdW5jdGlvbgoKICAgIHRhc2sgZ2V0KGludCBrZXlDb3VudCA9IDEpOwpgaWZkZWYgVkVSSUxBVE9SX1RJTUlORwogICAgICBkcm9wS2lsbGVkKCk7CiAgICAgIC8vIEZhc3QgcGF0aDogdGFrZSBpZiBrZXlzIGZpdCBBTkQgZWl0aGVyIG5vIG9uZSBpcyBxdWV1ZWQsIG9yCiAgICAgIC8vIHRoZSBoZWFkIHN0aWxsIGRvZXNuJ3QgZml0IChzbyB3ZSdyZSBub3Qgc3RlYWxpbmcgaXRzIGtleXMpLgogICAgICBpZiAobV9rZXlDb3VudCA+PSBrZXlDb3VudCAmJiAobV9xdWV1ZS5zaXplKCkgPT0gMCB8fCBtX3F1ZXVlWzBdLnJlcUtleXMgPiBrZXlDb3VudCkpIGJlZ2luCiAgICAgICAgbV9rZXlDb3VudCAtPSBrZXlDb3VudDsKICAgICAgICByZXR1cm47CiAgICAgIGVuZAogICAgICBtX3F1ZXVlLnB1c2hfYmFjaygne3Byb2Nlc3M6OnNlbGYoKSwga2V5Q291bnR9KTsKICAgICAgd2hpbGUgKG1fcXVldWVbMF0ucHJvYyAhPSBwcm9jZXNzOjpzZWxmKCkpIGJlZ2luCiAgICAgICAgd2FpdCAobV9xdWV1ZVswXS5wcm9jLnN0YXR1cygpID09IHByb2Nlc3M6OktJTExFRCB8fCBtX3F1ZXVlWzBdLnByb2MgPT0gcHJvY2Vzczo6c2VsZigpKTsKICAgICAgICBkcm9wS2lsbGVkKCk7CiAgICAgIGVuZAogICAgICB3YWl0IChtX2tleUNvdW50ID49IGtleUNvdW50KTsKICAgICAgbV9rZXlDb3VudCAtPSBrZXlDb3VudDsKICAgICAgbV9xdWV1ZS5wb3BfZnJvbnQoKTsKYGVuZGlmCiAgICBlbmR0YXNrCgogICAgZnVuY3Rpb24gaW50IHRyeV9nZXQoaW50IGtleUNvdW50ID0gMSk7CiAgICAgIGlmIChtX2tleUNvdW50IDwga2V5Q291bnQpIHJldHVybiAwOwogICAgICBtX2tleUNvdW50IC09IGtleUNvdW50OwogICAgICByZXR1cm4gMTsKICAgIGVuZGZ1bmN0aW9uCiAgZW5kY2xhc3MKCiAgLy8gSUVFRSAxODAwLXNwZWNpZmllZCBzdGFuZGFyZCAic3RkOjpyYW5kb21pemUiCiAgZnVuY3Rpb24gaW50IHJhbmRvbWl6ZSgpOwogICAgcmFuZG9taXplID0gMDsKICBlbmRmdW5jdGlvbgoKICAvLyBJRUVFIDE4MDAtMjAyMyAxOS4xMCBjb3ZlcmFnZSBvcHRpb24gYW5kIHR5cGVfb3B0aW9ucwogIC8vIElFRUUgZG9lcyBub3QgZGVmaW5lIHRoZXNlIGFzIHN0ZDo6IHN0cnVjdHVyZXMgYnV0IFZlcmlsYXRvciB1c2VzCiAgLy8gdGhlbSBhcyBzdWNoIGN1cnJlbnRseSwgc28gbmFtZWQgd2l0aCBhIHVuaXF1ZSBwcmVmaXgKICB0eXBlZGVmIHN0cnVjdCB7CiAgICBzdHJpbmcgbmFtZTsKICAgIGludCB3ZWlnaHQgPSAxOwogICAgaW50IGdvYWw7CiAgICBzdHJpbmcgY29tbWVudDsKICAgIGludCBhdF9sZWFzdDsKICAgIGludCBhdXRvX2Jpbl9tYXg7CiAgICBpbnQgY3Jvc3NfbnVtX3ByaW50X21pc3Npbmc7CiAgICBiaXQgY3Jvc3NfcmV0YWluX2F1dG9fYmluczsKICAgIGJpdCBkZXRlY3Rfb3ZlcmxhcDsKICAgIGJpdCBwZXJfaW5zdGFuY2U7CiAgICBiaXQgZ2V0X2luc3RfY292ZXJhZ2U7CiAgfSB2bF9jb3Zlcmdyb3VwX29wdGlvbnNfdDsKCiAgdHlwZWRlZiBzdHJ1Y3QgewogICAgaW50IHdlaWdodCA9IDE7CiAgICBpbnQgZ29hbDsKICAgIHN0cmluZyBjb21tZW50OwogICAgaW50IGF0X2xlYXN0OwogICAgaW50IGF1dG9fYmluX21heDsKICAgIGJpdCBkZXRlY3Rfb3ZlcmxhcDsKICB9IHZsX2NvdmVycG9pbnRfb3B0aW9uc190OwoKICB0eXBlZGVmIHN0cnVjdCB7CiAgICBpbnQgd2VpZ2h0ID0gMTsKICAgIGludCBnb2FsOwogICAgc3RyaW5nIGNvbW1lbnQ7CiAgICBpbnQgYXRfbGVhc3Q7CiAgICBpbnQgY3Jvc3NfbnVtX3ByaW50X21pc3Npbmc7CiAgICBiaXQgY3Jvc3NfcmV0YWluX2F1dG9fYmluczsKICB9IHZsX2Nyb3NzX29wdGlvbnNfdDsKCiAgdHlwZWRlZiBzdHJ1Y3QgewogICAgaW50IHdlaWdodCA9IDE7CiAgICBpbnQgZ29hbDsKICAgIHN0cmluZyBjb21tZW50OwogICAgYml0IHN0cm9iZTsKICAgIGJpdCBtZXJnZV9pbnN0YW5jZXM7CiAgICBiaXQgZGlzdHJpYnV0ZV9maXJzdDsKICAgIHJlYWwgcmVhbF9pbnRlcnZhbDsKICB9IHZsX2NvdmVyZ3JvdXBfdHlwZV9vcHRpb25zX3Q7CgogIHR5cGVkZWYgc3RydWN0IHsKICAgIGludCB3ZWlnaHQgPSAxOwogICAgaW50IGdvYWw7CiAgICBzdHJpbmcgY29tbWVudDsKICAgIHJlYWwgcmVhbF9pbnRlcnZhbDsKICB9IHZsX2NvdmVycG9pbnRfdHlwZV9vcHRpb25zX3Q7CgogIHR5cGVkZWYgc3RydWN0IHsKICAgIGludCB3ZWlnaHQgPSAxOwogICAgaW50IGdvYWw7CiAgICBzdHJpbmcgY29tbWVudDsKICB9IHZsX2Nyb3NzX3R5cGVfb3B0aW9uc190OwoKZW5kcGFja2FnZQoKYGVuZGlmICAvLyBHdWFyZAo=",
  "include/verilated_std_waiver.vlt": "Ly8gREVTQ1JJUFRJT046IFZlcmlsYXRvcjogYnVpbHQtaW4gc3RhbmRhcmQgbGludCB3YWl2ZXJzCi8vCi8vIENvZGUgYXZhaWxhYmxlIGZyb206IGh0dHBzOi8vdmVyaWxhdG9yLm9yZwovLwovLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioKLy8KLy8gVGhpcyBwcm9ncmFtIGlzIGZyZWUgc29mdHdhcmU7IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnkgaXQKLy8gdW5kZXIgdGhlIHRlcm1zIG9mIGVpdGhlciB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIFZlcnNpb24gMwovLyBvciB0aGUgUGVybCBBcnRpc3RpYyBMaWNlbnNlIFZlcnNpb24gMi4wLgovLyBTUERYLUZpbGVDb3B5cmlnaHRUZXh0OiAyMDAxLTIwMjYgV2lsc29uIFNueWRlcgovLyBTUERYLUxpY2Vuc2UtSWRlbnRpZmllcjogTEdQTC0zLjAtb25seSBPUiBBcnRpc3RpYy0yLjAKLy8KLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqCi8vLwovLy8gXGZpbGUKLy8vIFxicmllZiBWZXJpbGF0ZWQgYnVpbHQtaW4gc3RhbmRhcmQgbGludCB3YWl2ZXJzCi8vLwovLy8gVGhpcyBmaWxlIGlzIGluY2x1ZGVkIGF1dG9tYXRpY2FsbHkgYnkgVmVyaWxhdG9yLCB1bmxlc3MgJy0tbm8tc3RkLXdhaXZlcicKLy8vIGlzIHVzZWQuCi8vLwovLy8gVG8gYXNzaXN0IGluIGJ1aWxkaW5nIG5ldyBydWxlcywgdXNlOgovLy8gICAgICAndmVyaWxhdG9yIC0td2FpdmVyLW11bHRpbGluZSAtLXdhaXZlci1vdXRwdXQgPGZpbGVuYW1lPicKLy8vCi8vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKgoKYGlmbmRlZiBfVkVSSUxBVEVEX1NURF9XQUlWRVJfVkxUXwpgZGVmaW5lIF9WRVJJTEFURURfU1REX1dBSVZFUl9WTFRfCgpgdmVyaWxhdG9yX2NvbmZpZwoKLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Ci8vIFVWTQoKLy8gQXBwbHkgdGhlc2UgcnVsZXMgdG8gb25seSBVVk0gYmFzZSBmaWxlcwpgZGVmaW5lIFZMVF9VVk1fRklMRVMgLWZpbGUgIiovdXZtXyouc3ZoIiAtY29udGVudHMgIipVVk1fVkVSU0lPTl9TVFJJTkcqIgoKLy8gV2hvbGUtcGFja2FnZSBmaWxlIHdhaXZlcnMKbGludF9vZmYgLXJ1bGUgREVDTEZJTEVOQU1FIGBWTFRfVVZNX0ZJTEVTCmxpbnRfb2ZmIC1ydWxlIFVORFJJVkVOIGBWTFRfVVZNX0ZJTEVTCmxpbnRfb2ZmIC1ydWxlIFVOVVNFRCBgVkxUX1VWTV9GSUxFUwpsaW50X29mZiAtcnVsZSBWQVJISURERU4gYFZMVF9VVk1fRklMRVMKbGludF9vZmYgLXJ1bGUgV0lEVEhFWFBBTkQgYFZMVF9VVk1fRklMRVMKbGludF9vZmYgLXJ1bGUgV0lEVEhUUlVOQyBgVkxUX1VWTV9GSUxFUwoKLy8gQ29udGV4dC1zZW5zaXRpdmUgd2FpdmVycwpsaW50X29mZiAtcnVsZSBDQVNFSU5DT01QTEVURSBgVkxUX1VWTV9GSUxFUyAtbWF0Y2ggIiogY2FzZSAoe2lzX1IsIGlzX1d9KSoiCmxpbnRfb2ZmIC1ydWxlIENBU0VJTkNPTVBMRVRFIGBWTFRfVVZNX0ZJTEVTIC1tYXRjaCAiKiBjYXNlKG9yaWdfc2V2ZXJpdHkpKiIKbGludF9vZmYgLXJ1bGUgQ0FTVENPTlNUIGBWTFRfVVZNX0ZJTEVTIC1tYXRjaCAiKidjbGFzcyB1dm1fY2FsbGJhY2sqIgpsaW50X29mZiAtcnVsZSBDQVNUQ09OU1QgYFZMVF9VVk1fRklMRVMgLW1hdGNoICIqJ2NsYXNzIHV2bV9jb21wb25lbnQqIgpsaW50X29mZiAtcnVsZSBDQVNUQ09OU1QgYFZMVF9VVk1fRklMRVMgLW1hdGNoICIqJ2NsYXNzIHV2bV9ldmVudCoiCmxpbnRfb2ZmIC1ydWxlIENBU1RDT05TVCBgVkxUX1VWTV9GSUxFUyAtbWF0Y2ggIionY2xhc3MgdXZtX3JlcG9ydF9vYmplY3QqIgpsaW50X29mZiAtcnVsZSBDQVNUQ09OU1QgYFZMVF9VVk1fRklMRVMgLW1hdGNoICIqJ2NsYXNzIHV2bV9zZXF1ZW5jZV9pdGVtKiIKbGludF9vZmYgLXJ1bGUgSUdOT1JFRFJFVFVSTiBgVkxUX1VWTV9GSUxFUyAtbWF0Y2ggIiogdXZtX2NvcmVfc3RhdGVfY2FsbGJhY2s6OmFkZCoiCmxpbnRfb2ZmIC1ydWxlIE1JU0lOREVOVCBgVkxUX1VWTV9GSUxFUyAtbWF0Y2ggIiogZm9yZWFjaCAoYWJzdHJhY3Rpb25zW2ldKSoiCmxpbnRfb2ZmIC1ydWxlIE1JU0lOREVOVCBgVkxUX1VWTV9GSUxFUyAtbWF0Y2ggIiogZm9yZWFjaCAobG9ja19saXN0W2ldKSoiCmxpbnRfb2ZmIC1ydWxlIE1JU0lOREVOVCBgVkxUX1VWTV9GSUxFUyAtbWF0Y2ggIiogZm9yZWFjaCAobV9maWVsZHNbaV0pKiIgIC8vIDIwMTctMS4xCmxpbnRfb2ZmIC1ydWxlIE1JU0lOREVOVCBgVkxUX1VWTV9GSUxFUyAtbWF0Y2ggIiogaWYgKHJ3LmdldF9zdGF0dXMoKSoiICAvLyAyMDE3LTEuMQpsaW50X29mZiAtcnVsZSBNSVNJTkRFTlQgYFZMVF9VVk1fRklMRVMgLW1hdGNoICIqIHJ3X2FjY2Vzcy5kYXRhPSoiCmxpbnRfb2ZmIC1ydWxlIE1JU0lOREVOVCBgVkxUX1VWTV9GSUxFUyAtbWF0Y2ggIiogdXZtX2NtZGxpbmVfcHJvYyA9KiIKbGludF9vZmYgLXJ1bGUgUkVBTENWVCBgVkxUX1VWTV9GSUxFUyAtbWF0Y2ggIiogbV90aW1lICoiCmxpbnRfb2ZmIC1ydWxlIFJFQUxDVlQgYFZMVF9VVk1fRklMRVMgLW1hdGNoICIqJHJlYWx0aW1lKiIKbGludF9vZmYgLXJ1bGUgU0lERUVGRkVDVCBgVkxUX1VWTV9GSUxFUyAtbWF0Y2ggIipmb3JlYWNoIChibGtzW2Jsa19dLnJlZ19maWxlc1tibGtfcmZdKSoiCmxpbnRfb2ZmIC1ydWxlIFNZTVJTVkRXT1JEIGBWTFRfVVZNX0ZJTEVTIC1tYXRjaCAiKidkZWxldGUnKiIKbGludF9vZmYgLXJ1bGUgU1lNUlNWRFdPUkQgYFZMVF9VVk1fRklMRVMgLW1hdGNoICIqJ2xpc3QnKiIKbGludF9vZmYgLXJ1bGUgU1lNUlNWRFdPUkQgYFZMVF9VVk1fRklMRVMgLW1hdGNoICIqJ21hcCcqIgpsaW50X29mZiAtcnVsZSBTWU1SU1ZEV09SRCBgVkxUX1VWTV9GSUxFUyAtbWF0Y2ggIionb3ZlcnJpZGUnKiIKbGludF9vZmYgLXJ1bGUgU1lNUlNWRFdPUkQgYFZMVF9VVk1fRklMRVMgLW1hdGNoICIqJ3ZvbGF0aWxlJyoiCgovLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KYHVuZGVmIFZMVF9VVk1fRklMRVMKYGVuZGlmICAvLyBHdWFyZAo="
};
var VROOT_DIR = ".verilator-root";
var isNode = () => Boolean(globalThis.process && globalThis.process.versions && globalThis.process.versions.node);
var fromBase64 = (text) => {
  if (isNode()) {
    return new Uint8Array(globalThis.Buffer.from(text, "base64"));
  }
  const binary = globalThis.atob(text);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
};
var readUrl = async (url) => {
  if (isNode() && String(url).startsWith("file:")) {
    const { readFile } = await import("node:fs/promises");
    return new Uint8Array(await readFile(url));
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("verilator-wasm: fetch " + url + " failed with " + response.status);
  }
  return new Uint8Array(await response.arrayBuffer());
};
var loadWasmBytes = async (options) => {
  if (options.wasmBinary) {
    return options.wasmBinary instanceof Uint8Array ? options.wasmBinary : new Uint8Array(options.wasmBinary);
  }
  const candidates = options.wasmUrl ? [options.wasmUrl] : [new URL("./verilator.wasm", import.meta.url), new URL("../dist/verilator.wasm", import.meta.url)];
  const failures = [];
  for (const candidate of candidates) {
    try {
      return await readUrl(candidate);
    } catch (err) {
      failures.push(String(candidate) + ": " + err.message);
    }
  }
  throw new Error("verilator-wasm: could not load verilator.wasm\n  " + failures.join("\n  "));
};
var seedVroot = (vfs, mount) => {
  for (const [name, base64] of Object.entries(vrootFilesBase64)) {
    vfs.writeFile(mount, VROOT_DIR + "/" + name, fromBase64(base64));
  }
};
var createVerilator = async (options = {}) => {
  const wasmModule = options.wasmModule || await WebAssembly.compile(await loadWasmBytes(options));
  const run = async ({
    args = [],
    files = {},
    cwd = "/",
    env = {},
    onStdout = null,
    onStderr = null,
    now,
    random
  } = {}) => {
    const vfs = createVfs();
    const mount = vfs.mkdirp(vfs.root, cwd);
    seedVroot(vfs, mount);
    for (const [name, contents] of Object.entries(files)) {
      vfs.writeFile(mount, name, contents);
    }
    vfs.markClean();
    const wasi = createWasi({
      vfs,
      mountNode: mount,
      mountName: "/",
      args: ["verilator", ...args],
      env: {
        // Must be set or the built-in std:: and lint-waiver lookups fail; the
        // native run needs it too.
        VERILATOR_ROOT: "/" + VROOT_DIR,
        ...env
      },
      onStdout,
      onStderr,
      ...now ? { now } : {},
      ...random ? { random } : {}
    });
    const instance = await WebAssembly.instantiate(wasmModule, wasi.importObject);
    const harvest = () => {
      const raw = vfs.dirtyFiles(mount, { exclude: [VROOT_DIR] });
      const text = {};
      for (const [name, bytes] of Object.entries(raw)) {
        let cached;
        Object.defineProperty(text, name, {
          enumerable: true,
          configurable: true,
          get: () => cached === void 0 ? cached = decodeText(bytes) : cached
        });
      }
      return { filesBytes: raw, files: text };
    };
    let exitCode;
    try {
      exitCode = wasi.start(instance);
    } catch (err) {
      throw Object.assign(err, {
        stdout: wasi.stdout(),
        stderr: wasi.stderr(),
        ...harvest()
      });
    }
    return {
      exitCode,
      stdout: wasi.stdout(),
      stderr: wasi.stderr(),
      ...harvest()
    };
  };
  return { run, module: wasmModule };
};

// apps/web/public/verilator-worker-entry.js
var enginePromise;
function getEngine() {
  enginePromise ||= createVerilator({ wasmUrl: new URL("./verilator.wasm", self.location.href).href });
  return enginePromise;
}
self.onmessage = async (event) => {
  const { id, files, args } = event.data || {};
  try {
    if (typeof id !== "string" || !files || typeof files !== "object") {
      throw new Error("Verilator worker received an invalid request");
    }
    const engine = await getEngine();
    const result = await engine.run({
      args: Array.isArray(args) ? args : [],
      files
    });
    self.postMessage({
      id,
      ok: result.exitCode === 0,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      files: result.files
    });
  } catch (error) {
    self.postMessage({
      id,
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
};
