
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { AppState, ViewState, Channel, Video, Playlist } from './types';
import { scanDirectory } from './data_manager';
import { ExplorerView, ChannelView, PlaylistView } from './ui_home';
import { PlayerEngine } from './player_engine';
import { saveDirectoryHandle, getDirectoryHandle, deleteDirectoryHandle } from './db';

const ACCENT_PALETTE = [
  { name: 'Adwaita Blue', hex: '#3584e4' },
  { name: 'Emerald', hex: '#2ec27e' },
  { name: 'Amber', hex: '#f5c211' },
  { name: 'Orange', hex: '#ff7800' },
  { name: 'Red', hex: '#e01b24' },
  { name: 'Purple', hex: '#9141ac' }
];

const App: React.FC = () => {
  const [statusLog, setStatusLog] = useState("Inizializzazione Sistema...");
  
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('pt_v3_final_state');
    if (saved) return JSON.parse(saved);
    return {
      channels: [],
      activeChannel: null,
      activePlaylist: null,
      activeVideo: null,
      currentView: 'EXPLORER',
      viewHistory: [],
      isScanning: false,
      theme: 'dark',
      accentColor: '#3584e4'
    };
  });

  const [showSettings, setShowSettings] = useState(false);

  // -- LOGICA DI SINCRONIZZAZIONE AUTOMATICA ALL'AVVIO --
  useEffect(() => {
    const syncChannels = async () => {
      if (state.channels.length === 0) {
        setStatusLog("Sistema Pronto.");
        return;
      }

      setState(prev => ({ ...prev, isScanning: true }));
      setStatusLog("Sincronizzazione Libreria in corso...");

      const updatedChannels: Channel[] = [];

      for (const channel of state.channels) {
        try {
          const handle = await getDirectoryHandle(channel.id);
          
          if (handle) {
            let perm = await (handle as any).queryPermission({ mode: 'read' });
            if (perm === 'prompt') {
               try {
                 perm = await (handle as any).requestPermission({ mode: 'read' });
               } catch (e) {
                 console.warn("Impossibile richiedere permessi automaticamente:", e);
               }
            }
            
            if (perm === 'granted') {
              const refreshedPlaylists = await scanDirectory(handle);
              const oldVideosMap = new Map<string, Video>();
              channel.playlists.forEach(p => p.videos.forEach(v => oldVideosMap.set(v.id, v)));

              const mergedPlaylists = refreshedPlaylists.map(newPl => ({
                ...newPl,
                videos: newPl.videos.map(newVid => {
                  const oldVid = oldVideosMap.get(newVid.id);
                  if (oldVid) {
                    return {
                      ...newVid,
                      currentTime: oldVid.currentTime,
                      duration: oldVid.duration,
                      isWatched: oldVid.isWatched
                    };
                  }
                  return newVid;
                })
              }));

              updatedChannels.push({
                ...channel,
                playlists: mergedPlaylists
              });
            } else {
              updatedChannels.push(channel); 
            }
          } else {
            updatedChannels.push(channel);
          }
        } catch (err) {
          console.error(`Errore sync canale ${channel.id}:`, err);
          updatedChannels.push(channel);
        }
      }

      setState(prev => {
        let newActiveChannel = prev.activeChannel;
        let newActivePlaylist = prev.activePlaylist;
        let newActiveVideo = prev.activeVideo;

        if (prev.activeChannel) {
          const foundCh = updatedChannels.find(c => c.id === prev.activeChannel!.id);
          if (foundCh) newActiveChannel = foundCh;
        }

        if (newActiveChannel && prev.activePlaylist) {
          const foundPl = newActiveChannel.playlists.find(p => p.id === prev.activePlaylist!.id);
          if (foundPl) newActivePlaylist = foundPl;
        }

        if (newActivePlaylist && prev.activeVideo) {
          const foundVid = newActivePlaylist.videos.find(v => v.id === prev.activeVideo!.id);
          if (foundVid) newActiveVideo = foundVid;
        }

        return {
          ...prev,
          channels: updatedChannels,
          activeChannel: newActiveChannel,
          activePlaylist: newActivePlaylist,
          activeVideo: newActiveVideo,
          isScanning: false
        };
      });
      
      setStatusLog("✅ Libreria Sincronizzata e Aggiornata.");
    };

    syncChannels();
    // eslint-disable-next-line
  }, []); 

  // -- EFFETTI ESTETICI --
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
    document.documentElement.style.setProperty('--accent', state.accentColor);
    localStorage.setItem('pt_v3_final_state', JSON.stringify(state));
  }, [state]);

  const importFolder = async () => {
    try {
      // @ts-ignore
      const directoryHandle = await window.showDirectoryPicker();
      setState(prev => ({ ...prev, isScanning: true }));
      
      const playlists = await scanDirectory(directoryHandle);
      
      const newChannelId = Math.random().toString(36).substr(2, 9);
      
      await saveDirectoryHandle(newChannelId, directoryHandle);

      const newChannel: Channel = {
        id: newChannelId,
        folderName: directoryHandle.name,
        displayName: directoryHandle.name,
        handle: `@local_${directoryHandle.name.toLowerCase().replace(/\s/g, '')}`,
        playlists
      };

      setState(prev => ({
        ...prev,
        channels: [...prev.channels, newChannel],
        isScanning: false
      }));
      setStatusLog(`✅ Sorgente "${directoryHandle.name}" pronta.`);
    } catch (e) {
      console.error(e);
      setState(prev => ({ ...prev, isScanning: false }));
    }
  };

  const refreshChannel = async (channelId: string) => {
    try {
      // @ts-ignore
      const directoryHandle = await window.showDirectoryPicker(); 
      setState(prev => ({ ...prev, isScanning: true }));
      await saveDirectoryHandle(channelId, directoryHandle); 
      
      const playlists = await scanDirectory(directoryHandle);
      
      setState(prev => {
        const updatedChannels = prev.channels.map(ch => {
          if (ch.id === channelId) {
             const oldVideosMap = new Map<string, Video>();
             ch.playlists.forEach(p => p.videos.forEach(v => oldVideosMap.set(v.id, v)));
             
             const mergedPlaylists = playlists.map(newPl => ({
                ...newPl,
                videos: newPl.videos.map(newVid => {
                  const oldVid = oldVideosMap.get(newVid.id);
                  return oldVid ? { ...newVid, currentTime: oldVid.currentTime, isWatched: oldVid.isWatched } : newVid;
                })
             }));
             
             return { ...ch, playlists: mergedPlaylists };
          }
          return ch;
        });
        
        return { ...prev, channels: updatedChannels, isScanning: false };
      });
      setStatusLog("✅ Canale ricollegato.");
    } catch(e) {
      console.error(e);
      setState(prev => ({ ...prev, isScanning: false }));
    }
  };

  const removeChannel = async (id: string) => {
    await deleteDirectoryHandle(id);
    setState(p => ({...p, channels: p.channels.filter(c => c.id !== id)}));
  };

  const updateProgress = (videoId: string, cur: number, dur: number) => {
    const isFinished = (cur / dur) > 0.98;
    setState(prev => ({
      ...prev,
      channels: prev.channels.map(ch => ({
        ...ch,
        playlists: ch.playlists.map(pl => ({
          ...pl,
          videos: pl.videos.map(v => v.id === videoId ? { 
            ...v, 
            currentTime: cur, 
            duration: dur.toString(), 
            isWatched: v.isWatched || isFinished 
          } : v)
        }))
      }))
    }));
  };

  const navigate = (view: ViewState, payload: Partial<AppState>) => {
    setState(prev => ({
      ...prev,
      ...payload,
      currentView: view,
      viewHistory: [...prev.viewHistory, prev.currentView]
    }));
  };

  const goBack = () => {
    if (state.viewHistory.length === 0) return;
    const history = [...state.viewHistory];
    const prevView = history.pop() as ViewState;
    setState(prev => ({ ...prev, currentView: prevView, viewHistory: history }));
  };

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      
      {/* --- MONOCHROMATIC DEEP SPACE BACKGROUND --- */}
      <div className="space-container">
        {/* Procedural Stars */}
        <div className="stars-layer"></div>
        <div className="stars-layer distant"></div>
        
        {/* Cosmic Dust (Accent Gas) */}
        <div className="cosmic-dust"></div>
        
        {/* Centered Atom System */}
        <div className="atom-center-point">
          <div className="nucleus"></div>
          
          <div className="orbits-system">
            <div className="orbit-plane plane-1">
              <div className="orbit-ring"><div className="electron"></div></div>
            </div>
            <div className="orbit-plane plane-2">
              <div className="orbit-ring"><div className="electron"></div></div>
            </div>
            <div className="orbit-plane plane-3">
              <div className="orbit-ring"><div className="electron"></div></div>
            </div>
            <div className="orbit-plane plane-4">
              <div className="orbit-ring"><div className="electron"></div></div>
            </div>
          </div>
        </div>
      </div>

      <header className="adw-headerbar justify-between">
        <div className="flex items-center gap-6">
          {state.currentView !== 'EXPLORER' && (
            <button onClick={goBack} className="p-3 bg-white/5 hover:bg-[var(--accent)] hover:text-white rounded-[20px] active:scale-90 transition-all shadow-2xl border border-white/5 backdrop-blur-md">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          )}
          <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-50 mix-blend-overlay">PlayerTube</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowSettings(true)} className="p-3 bg-white/5 hover:bg-white/10 rounded-[18px] transition-all border border-white/5 shadow-xl group backdrop-blur-md">
            <svg className="w-5 h-5 opacity-40 group-hover:opacity-100 group-hover:rotate-90 transition-all" fill="currentColor" viewBox="0 0 24 24"><path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5 3.5 3.5 0 0 1 15.5 12 3.5 3.5 0 0 1 12 15.5M19.43 12.97c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-.97l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65c-.03-.24-.24-.42-.49-.42h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.97 0 .33.03.66.07.97l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73(1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65z"/></svg>
          </button>
          <button onClick={importFolder} className="pill-button shadow-xl">Importa</button>
        </div>
      </header>

      <main className="flex-1 relative">
        <div key={state.currentView} className="view-content overflow-y-auto">
          {state.currentView === 'EXPLORER' && (
            <ExplorerView 
              onNavigate={navigate} 
              channels={state.channels} 
              onRemoveChannel={removeChannel}
              onRefreshChannel={refreshChannel}
            />
          )}
          {state.currentView === 'CHANNEL_DETAIL' && <ChannelView onNavigate={navigate} activeChannel={state.activeChannel} />}
          {state.currentView === 'PLAYLIST_DETAIL' && <PlaylistView onNavigate={navigate} activePlaylist={state.activePlaylist} />}
          {state.currentView === 'PLAYER' && state.activeVideo && state.activePlaylist && (
            <PlayerEngine 
              video={state.activeVideo} 
              playlist={state.activePlaylist} 
              onClose={goBack} 
              onProgress={(cur, dur) => updateProgress(state.activeVideo!.id, cur, dur)}
              onVideoChange={(v) => setState(prev => ({ ...prev, activeVideo: v }))}
            />
          )}
        </div>
      </main>

      <footer className="h-10 bg-black/5 dark:bg-black/30 border-t border-white/5 flex items-center px-8 justify-between backdrop-blur-md">
        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] opacity-30">
          <div className={`w-2 h-2 rounded-full accent-bg shadow-[0_0_8px_var(--accent)] ${state.isScanning ? 'animate-ping' : 'animate-pulse'}`}></div>
          {statusLog}
        </div>
        <div className="text-[9px] font-black opacity-20 uppercase tracking-[0.4em]">
          V1.3.0 • QUANTUM CORE ENGINE
        </div>
      </footer>

      {showSettings && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-3xl z-[2000] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="magnificent-card w-full max-w-lg p-10 rounded-[48px] shadow-[0_40px_80px_rgba(0,0,0,0.8)] border border-white/10">
            <h2 className="text-4xl font-black mb-10 tracking-tighter">Estetica</h2>
            <div className="space-y-10">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 mb-6">Modalità Visione</p>
                <div className="grid grid-cols-2 gap-6">
                  <button onClick={() => setState(p => ({...p, theme: 'light'}))} className={`py-5 rounded-[24px] font-black text-xs border-2 transition-all ${state.theme === 'light' ? 'accent-border accent-text bg-[var(--accent)]/10 scale-105 shadow-2xl' : 'border-black/5 opacity-50 hover:opacity-100'}`}>Light Candid</button>
                  <button onClick={() => setState(p => ({...p, theme: 'dark'}))} className={`py-5 rounded-[24px] font-black text-xs border-2 transition-all ${state.theme === 'dark' ? 'accent-border accent-text bg-[var(--accent)]/10 scale-105 shadow-2xl' : 'border-white/5 opacity-50 hover:opacity-100'}`}>Dark OLED+</button>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 mb-6">Accento Atmosferico</p>
                <div className="grid grid-cols-6 gap-4">
                  {ACCENT_PALETTE.map(c => (
                    <button key={c.hex} onClick={() => setState(p => ({ ...p, accentColor: c.hex }))} className={`w-full aspect-square rounded-full border-[4px] transition-all hover:scale-110 ${state.accentColor === c.hex ? 'border-white shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-105' : 'border-transparent opacity-40'}`} style={{ background: c.hex }} />
                  ))}
                </div>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-full py-5 accent-bg text-white font-black rounded-[28px] shadow-xl hover:brightness-125 active:scale-95 transition-all text-base tracking-tight">Applica Parametri</button>
            </div>
          </div>
        </div>
      )}

      {state.isScanning && (
        <div className="fixed inset-0 bg-black/98 z-[3000] flex flex-col items-center justify-center animate-in fade-in cursor-progress">
          <div className="w-16 h-16 border-[6px] accent-border border-t-transparent rounded-full animate-spin mb-8 shadow-[0_0_40px_var(--accent)]"></div>
          <p className="text-xs font-black uppercase tracking-[0.5em] accent-text animate-pulse">Analisi...</p>
        </div>
      )}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
