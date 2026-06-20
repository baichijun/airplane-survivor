import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { UPDATE_MANIFEST_URL, type UpdateManifest } from './config/update';

const MANIFEST_TIMEOUT_MS = 5000;

function parseVersionParts(version: string): number[] {
  return version
    .split('.')
    .map((part) => Number.parseInt(part.replace(/[^\d].*$/, ''), 10))
    .map((n) => (Number.isFinite(n) ? n : 0));
}

/** 比较远程与本地版本，远程更高时返回 true */
export function isRemoteVersionNewer(remote: string, local: string): boolean {
  const a = parseVersionParts(remote);
  const b = parseVersionParts(local);
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    if (av > bv) return true;
    if (av < bv) return false;
  }
  return false;
}

async function fetchManifest(): Promise<UpdateManifest | null> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), MANIFEST_TIMEOUT_MS);
  try {
    const res = await fetch(UPDATE_MANIFEST_URL, {
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as UpdateManifest;
    if (!data.version || !data.url) return null;
    return data;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

/**
 * 有网且远程版本更高时后台下载 bundle，下次冷启动生效。
 * 无网或失败时静默跳过，继续使用内置包或已有缓存。
 */
export async function prepareLiveUpdate(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const current = await CapacitorUpdater.current();
    const localVersion =
      current.bundle.version && current.bundle.version !== 'builtin'
        ? current.bundle.version
        : current.native;
    const manifest = await fetchManifest();
    if (!manifest) return;
    if (!isRemoteVersionNewer(manifest.version, localVersion)) return;

    const bundle = await CapacitorUpdater.download({
      version: manifest.version,
      url: manifest.url,
      checksum: manifest.checksum,
    });
    await CapacitorUpdater.next({ id: bundle.id });
  } catch {
    // 离线或下载失败：继续使用当前 bundle
  }
}

/** 游戏成功启动后必须调用，否则 Capgo 会回滚到上一版本 */
export async function confirmLiveUpdateReady(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await CapacitorUpdater.notifyAppReady();
  } catch {
    // 非原生或未初始化时忽略
  }
}
