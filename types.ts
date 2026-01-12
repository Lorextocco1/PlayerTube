
export type ViewState = 'EXPLORER' | 'CHANNEL_DETAIL' | 'PLAYLIST_DETAIL' | 'PLAYER';
export type ThemeMode = 'light' | 'dark';

export interface Video {
  id: string;
  title: string;
  originalName: string; // Per il sorting numerico
  path: string;
  index: number;
  duration?: string;
  size?: string;
  handle?: FileSystemFileHandle;
  currentTime?: number;
  isWatched?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  videoCount: number;
  videos: Video[];
  totalSize?: string;
}

export interface Channel {
  id: string;
  folderName: string;
  displayName: string;
  handle: string;
  playlists: Playlist[];
}

export interface AppState {
  channels: Channel[];
  activeChannel: Channel | null;
  activePlaylist: Playlist | null;
  activeVideo: Video | null;
  currentView: ViewState;
  viewHistory: ViewState[];
  isScanning: boolean;
  theme: ThemeMode;
  accentColor: string;
}
