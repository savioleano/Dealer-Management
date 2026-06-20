import os from 'os'
import path from 'path'

// Payment slips are stored OUTSIDE the project tree (so Next's dev file-watcher
// is never triggered) and outside `public` (so they're not publicly served).
// On Vercel only /tmp is writable, which os.tmpdir() resolves to.
export function slipDir(): string {
  return path.join(os.tmpdir(), 'dealer-portal-slips')
}

const TYPE_TO_EXT: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/webp': '.webp',
}

export function slipExtFromType(type: string): string {
  return TYPE_TO_EXT[type] ?? '.bin'
}

const EXT_TO_TYPE: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
}

export function slipTypeFromExt(ext: string): string {
  return EXT_TO_TYPE[ext.toLowerCase()] ?? 'application/octet-stream'
}
