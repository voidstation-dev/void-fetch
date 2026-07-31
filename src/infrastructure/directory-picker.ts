/**
 * VoidFetch
 * Copyright (c) 2026 VoidStation.
 * All rights reserved.
 */

// Global reference for in-memory active directory handle
let activeDirectoryHandle: FileSystemDirectoryHandle | null = null;
let activeDirectoryName: string | null = null;

interface ExtendedFileSystemHandle {
  queryPermission?: (descriptor?: { mode?: 'read' | 'readwrite' }) => Promise<PermissionState>;
  requestPermission?: (descriptor?: { mode?: 'read' | 'readwrite' }) => Promise<PermissionState>;
}

interface WindowWithDirectoryPicker {
  showDirectoryPicker?: (options?: { mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>;
}

export function isDirectoryPickerSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

export function getActiveDirectoryName(): string | null {
  return activeDirectoryName;
}

export function getActiveDirectoryHandle(): FileSystemDirectoryHandle | null {
  return activeDirectoryHandle;
}

export function clearActiveDirectoryHandle(): void {
  activeDirectoryHandle = null;
  activeDirectoryName = null;
}

export async function selectCustomDirectory(): Promise<string | null> {
  if (!isDirectoryPickerSupported()) {
    throw new Error('Your browser does not support custom directory selection. Download files will use standard browser downloads.');
  }

  try {
    const win = window as unknown as WindowWithDirectoryPicker;
    if (!win.showDirectoryPicker) {
      throw new Error('showDirectoryPicker unavailable');
    }
    const handle = await win.showDirectoryPicker({
      mode: 'readwrite',
    });
    activeDirectoryHandle = handle;
    activeDirectoryName = handle.name;
    return handle.name;
  } catch (err: unknown) {
    if (err instanceof DOMException) {
      if (err.name === 'AbortError') {
        return null; // User cancelled
      }
      if (err.name === 'SecurityError') {
        throw new Error('Chrome/Browser blocks selecting root system folders (like root Downloads) for security. Please pick a subfolder inside Downloads (e.g. Downloads/VoidFetch) or any custom folder on your drive.');
      }
    }
    throw err;
  }
}

export async function saveBlobToCustomDirectory(
  directoryHandle: FileSystemDirectoryHandle,
  filename: string,
  blob: Blob
): Promise<boolean> {
  try {
    // Verify or request readwrite permission
    const opts = { mode: 'readwrite' as const };
    const extHandle = directoryHandle as unknown as ExtendedFileSystemHandle;
    let permission: PermissionState = 'granted';
    if (extHandle.queryPermission) {
      permission = await extHandle.queryPermission(opts);
    }
    if (permission !== 'granted' && extHandle.requestPermission) {
      permission = await extHandle.requestPermission(opts);
    }
    if (permission !== 'granted') {
      return false;
    }

    const fileHandle = await directoryHandle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
    return true;
  } catch (err) {
    console.warn('Failed writing blob to custom directory handle:', err);
    return false;
  }
}

/**
 * Universal file save helper that writes to custom folder if set, or falls back to browser downloads.
 */
export async function saveDownloadedFile(blob: Blob, filename: string): Promise<{ savedToCustomDir: boolean }> {
  if (activeDirectoryHandle) {
    const success = await saveBlobToCustomDirectory(activeDirectoryHandle, filename, blob);
    if (success) {
      return { savedToCustomDir: true };
    }
  }

  // Fallback to standard browser download trigger
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 1000);

  return { savedToCustomDir: false };
}
