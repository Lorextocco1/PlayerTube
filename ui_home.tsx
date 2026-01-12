
import React from 'react';
import { Channel, Playlist, Video } from './types';

interface ViewProps {
  onNavigate: (view: string, payload: any) => void;
  channels?: Channel[];
  activeChannel?: Channel | null;
  activePlaylist?: Playlist | null;
  onRemoveChannel?: (id: string) => void;
  onRefreshChannel?: (id: string) => void;
}

const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

const AbstractIcon = ({ name, size = "w-12 h-12", watched = false }: { name: string, size?: string, watched?: boolean }) => (
  <div className={`${size} rounded-[24px] flex items-center justify-center font-black text-xs tracking-tighter transition-all duration-700 border border-white/10
    ${watched ? 'bg-green-500/20 text-green-500 border-green-500/30' : 'bg-gradient-to-br from-[var(--accent)] to-black text-white shadow-2xl'}`}>
    {watched ? (
      <svg className="w-1/2 h-1/2" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
    ) : getInitials(name)}
  </div>
);

export const ExplorerView: React.FC<ViewProps> = ({ onNavigate, channels, onRemoveChannel, onRefreshChannel }) => (
  <div className="p-10 max-w-7xl mx-auto">
    <div className="mb-10 pl-2">
      <h1 className="text-5xl font-black tracking-tighter mb-4 drop-shadow-2xl">Libreria</h1>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">Sorgenti locali sincronizzate</p>
    </div>
    
    <div className="grid grid-cols-1 gap-5">
      {channels?.map(ch => (
        <div 
          key={ch.id} 
          onClick={() => onNavigate('CHANNEL_DETAIL', { activeChannel: ch })}
          className="group magnificent-card p-6 rounded-[36px] flex items-center justify-between cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-center gap-6 relative z-10">
            <AbstractIcon name={ch.displayName} size="w-16 h-16" />
            <div>
              <h3 className="text-xl font-black group-hover:accent-text transition-colors drop-shadow-lg">{ch.displayName}</h3>
              <p className="text-[10px] opacity-30 font-black uppercase tracking-[0.3em] mt-1">{ch.handle} • {ch.playlists.length} PERCORSI</p>
            </div>
          </div>
          <div className="flex items-center gap-3 relative z-10">
             <button 
                onClick={(e) => { e.stopPropagation(); onRefreshChannel?.(ch.id); }}
                className="p-3 bg-white/5 hover:bg-yellow-500/20 hover:text-yellow-400 rounded-full transition-all shadow-xl border border-white/5"
                title="Riconnetti"
             >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
             </button>
             <button 
                onClick={(e) => { e.stopPropagation(); onRemoveChannel?.(ch.id); }}
                className="p-3 bg-white/5 hover:bg-red-500 rounded-full group-hover:bg-white/10 group-hover:text-white transition-all shadow-xl border border-white/5"
             >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
             </button>
             <div className="p-3 bg-white/5 rounded-full group-hover:accent-bg group-hover:text-white transition-all shadow-xl border border-white/5">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
             </div>
          </div>
        </div>
      ))}
      
      {channels?.length === 0 && (
        <div className="py-20 text-center opacity-10 border-[4px] border-dashed border-white/10 rounded-[60px]">
          <p className="text-xs font-black uppercase tracking-[0.5em]">Trascina una cartella</p>
        </div>
      )}
    </div>
  </div>
);

export const ChannelView: React.FC<ViewProps> = ({ onNavigate, activeChannel: ch }) => {
  if (!ch) return null;
  return (
    <div className="p-10 max-w-7xl mx-auto">
      <div className="mb-12 flex items-end gap-10">
        <AbstractIcon name={ch.displayName} size="w-32 h-32" />
        <div className="pb-4">
          <h1 className="text-6xl font-black tracking-tighter leading-none mb-4 drop-shadow-2xl">{ch.displayName}</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-30">{ch.playlists.length} RACCOLTE INDIVIDUATE</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {ch.playlists.map(p => {
          const isFinished = p.videos.every(v => v.isWatched);
          const watchedCount = p.videos.filter(v => v.isWatched).length;
          
          return (
            <div 
              key={p.id} 
              onClick={() => onNavigate('PLAYLIST_DETAIL', { activePlaylist: p })}
              className={`group magnificent-card p-8 rounded-[40px] flex items-center justify-between cursor-pointer
                ${isFinished ? 'opacity-40 grayscale-[0.5]' : ''}`}
            >
              <div className="flex items-center gap-8">
                <div className="w-1.5 h-16 rounded-full accent-bg opacity-10 group-hover:opacity-100 group-hover:shadow-[0_0_15px_var(--accent)] transition-all" />
                <div>
                  <h3 className="text-2xl font-black group-hover:accent-text transition-colors drop-shadow-lg">{p.name}</h3>
                  <div className="flex items-center gap-5 mt-3 text-[10px] font-black uppercase tracking-[0.2em] opacity-30">
                    <span className="flex items-center gap-2">
                       <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>
                       {p.videoCount} VIDEO
                    </span>
                    <span className={`px-3 py-1 rounded-full ${watchedCount > 0 ? 'bg-[var(--accent)]/10 accent-text' : 'bg-white/5'}`}>
                      {watchedCount} COMPLETATI
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black opacity-20 uppercase mb-2 tracking-widest">VOLUME</p>
                <p className="text-lg font-black opacity-70 tracking-tighter font-mono">{p.totalSize}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const PlaylistView: React.FC<ViewProps> = ({ onNavigate, activePlaylist: p }) => {
  if (!p) return null;
  return (
    <div className="p-10 max-w-7xl mx-auto">
      <div className="mb-12 flex justify-between items-end border-b border-white/5 pb-8">
        <div>
          <h1 className="text-6xl font-black tracking-tighter leading-none mb-4 drop-shadow-2xl">{p.name}</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-30">SEQUENZA GEOMETRICA • {p.videoCount} TRACKS</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {p.videos.map((v, i) => {
          const progress = v.currentTime && v.duration ? (v.currentTime / parseFloat(v.duration)) * 100 : 0;
          
          return (
            <div 
              key={v.id} 
              onClick={() => onNavigate('PLAYER', { activeVideo: v })}
              className={`group magnificent-card flex items-center gap-6 p-5 rounded-[28px] cursor-pointer
                ${v.isWatched ? 'opacity-40 grayscale' : ''}`}
            >
              <div className="w-10 text-center text-sm font-black opacity-10 group-hover:opacity-100 group-hover:accent-text transition-all font-mono">
                {(i + 1).toString().padStart(2, '0')}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-black group-hover:accent-text transition-colors line-clamp-1 drop-shadow-sm">{v.title}</h4>
                  <div className="flex items-center gap-4">
                    {v.currentTime && v.currentTime > 0 && (
                      <span className="text-[9px] font-black bg-[var(--accent)]/10 accent-text px-3 py-1 rounded-full shadow-lg border border-[var(--accent)]/10">RESUME @ {Math.floor(v.currentTime / 60)}m</span>
                    )}
                    <span className="text-[10px] font-mono opacity-20 tracking-widest">{v.size}</span>
                  </div>
                </div>
                
                <div className="h-1.5 w-full bg-black/10 dark:bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${v.isWatched ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'accent-bg shadow-[0_0_10px_var(--accent)]'}`} 
                    style={{ width: `${v.isWatched ? 100 : progress || 0}%` }} 
                  />
                </div>
              </div>

              {v.isWatched && (
                <div className="w-10 h-10 flex items-center justify-center text-green-500 bg-green-500/10 rounded-full shadow-xl border border-green-500/20">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
