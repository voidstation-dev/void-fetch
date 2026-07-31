import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 通用文件下载函数
 * @param url 下载链接
 * @param filename 可选的文件名
 */
export function downloadFile(
  url: string,
  filename?: string,
  openInNewTab = true,
) {
  const a = document.createElement("a");
  a.href = url;
  if (filename) {
    a.download = filename;
  }
  if (openInNewTab) {
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  }
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * 格式化时长（秒 -> mm:ss）
 * @param seconds 秒数
 */
export function formatDuration(seconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * 清理文件名中的非法字符
 * @param filename 原始文件名
 * @param replacement 替换字符，默认为 '-'
 */
export function sanitizeFilename(
  filename: string,
  replacement: string = "-",
): string {
  return filename.replace(/[<>:"/\\|?*]/g, replacement);
}

/**
 * 格式化字节为可读的文件大小
 * @param bytes 字节数
 * @param decimals 小数位数，默认为 1
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(decimals)} ${sizes[i]}`;
}

/**
 * 格式化传输速度
 * @param bytesPerSec 字节/秒
 */
export function formatSpeed(bytesPerSec?: number): string {
  if (!bytesPerSec || bytesPerSec <= 0) return "0 KB/s";
  if (bytesPerSec < 1024 * 1024)
    return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
  return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
}

/**
 * 格式化预计剩余时间 (ETA)
 * @param seconds 秒数
 */
export function formatEta(seconds?: number): string {
  if (!seconds || seconds <= 0 || !Number.isFinite(seconds)) return "";
  const totalSeconds = Math.max(1, Math.round(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m ${secs}s`;
  }
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}
