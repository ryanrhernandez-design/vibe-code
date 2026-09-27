// Art registry: portraits cropped from the Type C character sheets (see tools/extract_art.py)
// and arena backdrops. Units without concept art fall back to a rendered figurine portrait.

import type { BoardId } from './theme';

const portraits = import.meta.glob('../assets/portraits/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const boards = import.meta.glob('../assets/boards/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
import heroUrl from '../assets/hero_mossback.webp?url';

const byName = (files: Record<string, string>) =>
  Object.fromEntries(Object.entries(files).map(([path, url]) => [path.split('/').pop()!.replace('.webp', ''), url]));

const PORTRAITS = byName(portraits);
const BOARD_ART = byName(boards) as Record<BoardId, string>;
/** Portraits rendered at runtime for units that have no concept sheet yet. */
const rendered: Record<string, { full: string; bust: string }> = {};

export function setRenderedPortrait(id: string, full: string, bust: string) {
  rendered[id] = { full, bust };
}

export function hasConceptArt(id: string) {
  return !!PORTRAITS[id];
}

/** Full-figure portrait (3:4). */
export function portrait(id: string): string {
  return PORTRAITS[id] ?? rendered[id]?.full ?? '';
}

/** Head-and-shoulders portrait (square). */
export function bust(id: string): string {
  return PORTRAITS[`${id}_bust`] ?? rendered[id]?.bust ?? '';
}

export function boardArt(id: BoardId): string {
  return BOARD_ART[id];
}

export const HERO_ART = heroUrl;
