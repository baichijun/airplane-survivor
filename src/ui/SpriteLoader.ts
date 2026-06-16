/** 飞机贴图编号与路径（编号规则：从左到右、从上到下） */
const SPRITE_PATHS: Record<number, string> = {
  1: '/sprites/ship-1.png',
  2: '/sprites/ship-2.png',
  3: '/sprites/ship-3.png',
  4: '/sprites/ship-4.png',
  5: '/sprites/ship-5.png',
  6: '/sprites/ship-6.png',
};

const cache = new Map<number, HTMLImageElement>();
let ready = false;

export function areShipSpritesReady(): boolean {
  return ready;
}

export function getShipSprite(id: number): HTMLImageElement | null {
  return cache.get(id) ?? null;
}

/** 预加载全部飞机贴图 */
export function loadShipSprites(): Promise<void> {
  const ids = Object.keys(SPRITE_PATHS).map(Number);
  return Promise.all(
    ids.map(
      (id) =>
        new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            cache.set(id, img);
            resolve();
          };
          img.onerror = () => reject(new Error(`无法加载贴图 ship-${id}`));
          img.src = SPRITE_PATHS[id];
        }),
    ),
  ).then(() => {
    ready = true;
  });
}
