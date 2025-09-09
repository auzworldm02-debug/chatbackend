import Redis from 'ioredis';

type Mem = Map<string, any>;

let mem: Mem = new Map();
let redis: Redis | null = null;

export function initRedis(url?: string, tls?: boolean) {
  if (!url) return;
  redis = new Redis(url, tls ? { tls: { rejectUnauthorized: false } } : {});
  redis.on('error', (e) => console.error('Redis error', e));
}

export async function setState(key: string, val: any) {
  if (redis) {
    await redis.set(key, JSON.stringify(val), 'EX', 60 * 60);
  } else {
    mem.set(key, val);
  }
}
export async function getState<T=any>(key: string): Promise<T | null> {
  if (redis) {
    const v = await redis.get(key);
    return v ? JSON.parse(v) : null;
  }
  return (mem.get(key) ?? null) as any;
}
export async function delState(key: string) {
  if (redis) await redis.del(key);
  else mem.delete(key);
}
