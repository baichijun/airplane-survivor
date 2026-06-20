/** GitHub Pages 上的 OTA 更新清单（与 deploy 工作流生成的 manifest.json 对应） */
export const UPDATE_MANIFEST_URL =
  import.meta.env.VITE_UPDATE_MANIFEST_URL ??
  'https://baichijun.github.io/airplane-survivor/updates/manifest.json';

export interface UpdateManifest {
  version: string;
  url: string;
  checksum?: string;
}
