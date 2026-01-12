
import { Channel, Playlist, Video } from './types';

export const cleanTitle = (filename: string): string => {
  let name = filename.replace(/\.[^/.]+$/, "");
  // Non rimuoviamo i numeri all'inizio perché servono all'utente per orientarsi nel titolo
  name = name.replace(/\[.*?\]|\(.*?\)/g, '');
  name = name.replace(/(1080p|720p|4k|x264|x265|bluray|h264|h265|web-dl)/gi, '');
  name = name.replace(/[\_\.]/g, ' ');
  return name.trim() || filename;
};

const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.webm', '.avi', '.mov', '.m4v'];

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Sorting naturale (numeric aware) per file come "1.mp4", "10.mp4", "2.mp4"
const naturalSort = (a: string, b: string) => {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
};

export const scanDirectory = async (directoryHandle: FileSystemDirectoryHandle): Promise<Playlist[]> => {
  const playlists: Map<string, Playlist> = new Map();
  const rootVideos: Video[] = [];
  let rootBytes = 0;

  // @ts-ignore
  for await (const entry of directoryHandle.values()) {
    if (entry.kind === 'file' && VIDEO_EXTENSIONS.some(ext => entry.name.toLowerCase().endsWith(ext))) {
      const fileEntry = entry as FileSystemFileHandle;
      const file = await fileEntry.getFile();
      rootBytes += file.size;
      rootVideos.push({
        id: entry.name,
        title: cleanTitle(entry.name),
        originalName: entry.name,
        path: entry.name,
        index: 0,
        size: formatSize(file.size),
        handle: fileEntry
      });
    } else if (entry.kind === 'directory' && !entry.name.startsWith('.')) {
      const dirEntry = entry as FileSystemDirectoryHandle;
      const subVideos: Video[] = [];
      let subBytes = 0;
      for await (const subEntry of dirEntry.values()) {
        if (subEntry.kind === 'file' && VIDEO_EXTENSIONS.some(ext => subEntry.name.toLowerCase().endsWith(ext))) {
          const subFileEntry = subEntry as FileSystemFileHandle;
          const file = await subFileEntry.getFile();
          subBytes += file.size;
          subVideos.push({
            id: `${entry.name}/${subEntry.name}`,
            title: cleanTitle(subEntry.name),
            originalName: subEntry.name,
            path: `${entry.name}/${subEntry.name}`,
            index: 0,
            size: formatSize(file.size),
            handle: subFileEntry
          });
        }
      }
      if (subVideos.length > 0) {
        // Ordiniamo i video per nome file originale usando il natural sort
        const sortedVideos = subVideos.sort((a, b) => naturalSort(a.originalName, b.originalName))
          .map((v, i) => ({ ...v, index: i }));

        playlists.set(entry.name, {
          id: entry.name,
          name: entry.name,
          videoCount: sortedVideos.length,
          videos: sortedVideos,
          totalSize: formatSize(subBytes)
        });
      }
    }
  }

  const result = Array.from(playlists.values()).sort((a, b) => naturalSort(a.name, b.name));
  if (rootVideos.length > 0) {
    const sortedRoot = rootVideos.sort((a, b) => naturalSort(a.originalName, b.originalName))
      .map((v, i) => ({ ...v, index: i }));
    result.unshift({ id: 'root', name: 'Main Folder', videoCount: sortedRoot.length, videos: sortedRoot, totalSize: formatSize(rootBytes) });
  }
  return result;
};
