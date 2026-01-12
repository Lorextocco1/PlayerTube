
import React, { useState, useRef, useEffect } from 'react';
import { Video, Playlist } from './types';

interface PlayerEngineProps {
  video: Video;
  playlist: Playlist;
  onClose: () => void;
  onVideoChange: (video: Video) => void;
  onProgress: (currentTime: number, duration: number) => void;
}

export const PlayerEngine: React.FC<PlayerEngineProps> = ({ video, playlist, onClose, onVideoChange, onProgress }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(video.currentTime || 0);
  const [duration, setDuration] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [showControls, setShowControls] = useState(true);
  const [systemTime, setSystemTime] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  
  const [skipTime, setSkipTime] = useState(5);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [aiUpscale, setAiUpscale] = useState(true);

  const controlsTimeout = useRef<number | null>(null);

  // Keyboard Shortcuts Logic
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (videoRef.current) videoRef.current.currentTime -= 5; // 5 secondi
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (videoRef.current) videoRef.current.currentTime += 5; // 5 secondi
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const loadVideo = async () => {
      if (video.handle) {
        const file = await video.handle.getFile();
        const url = URL.createObjectURL(file);
        setVideoUrl(url);
        
        if (videoRef.current) {
          videoRef.current.load();
          videoRef.current.currentTime = video.currentTime || 0;
          videoRef.current.playbackRate = playbackRate;
          videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        }
      }
    };
    loadVideo();
    return () => { if (videoUrl) URL.revokeObjectURL(videoUrl); };
  }, [video]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setSystemTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const skip = (seconds: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout.current) window.clearTimeout(controlsTimeout.current);
    controlsTimeout.current = window.setTimeout(() => {
      if (isPlaying && !showSettings) setShowControls(false);
    }, 4000);
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black z-[1000] flex flex-col overflow-hidden select-none"
      onMouseMove={handleMouseMove}
      style={{ cursor: showControls ? 'default' : 'none' }}
    >
      <video 
        ref={videoRef}
        src={videoUrl}
        className={`w-full h-full transition-all duration-1000 ${aiUpscale ? 'ai-upscale-active' : ''}`}
        onTimeUpdate={() => {
          if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
            onProgress(videoRef.current.currentTime, videoRef.current.duration);
          }
        }}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        onEnded={() => {
          const nextIdx = video.index + 1;
          if (nextIdx < playlist.videos.length) onVideoChange(playlist.videos[nextIdx]);
          else onClose();
        }}
        onClick={togglePlay}
        playsInline
      />

      {/* OVERLAY CRYSTAL CONTROLS */}
      <div className={`absolute inset-0 transition-all duration-1000 pointer-events-none ${showControls ? 'opacity-100 backdrop-blur-[2px]' : 'opacity-0 backdrop-blur-0'}`}>
        
        {/* TOP BAR */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start pointer-events-auto">
          <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
              className={`p-4 rounded-[20px] transition-all shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/20 ${showSettings ? 'accent-bg text-white scale-110 rotate-90' : 'bg-white/10 text-white backdrop-blur-3xl hover:brightness-150 hover:scale-110'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeWidth="2.5"/><circle cx="12" cy="12" r="3" strokeWidth="2.5"/></svg>
            </button>

            {/* CRYSTAL SETTINGS PANEL - High Contrast */}
            <div className={`absolute top-full left-0 mt-4 w-72 bg-black/80 backdrop-blur-[60px] border border-white/20 p-6 rounded-[32px] transition-all origin-top-left shadow-[0_30px_60px_rgba(0,0,0,0.8)] ${showSettings ? 'scale-100 opacity-100' : 'scale-75 opacity-0 pointer-events-none'}`}>
              <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-white opacity-40 mb-6">Engine Vision</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-white">AI Smooth-Res</p>
                    <p className="text-[9px] opacity-40 uppercase tracking-widest mt-1 text-white">Dynamic Sharpening</p>
                  </div>
                  <button onClick={() => setAiUpscale(!aiUpscale)} className={`w-12 h-6 rounded-full transition-all relative ${aiUpscale ? 'accent-bg' : 'bg-white/10'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-2xl transition-all ${aiUpscale ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
                <div>
                  <p className="text-[9px] font-black opacity-30 uppercase tracking-[0.3em] mb-3 text-white">Jump (Seconds)</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 15, 20].map(s => (
                      <button key={s} onClick={() => setSkipTime(s)} className={`py-2 rounded-xl text-[10px] font-black transition-all ${skipTime === s ? 'accent-bg text-white shadow-[0_0_10px_var(--accent)]' : 'bg-white/5 text-white hover:bg-white/20'}`}>{s}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-black opacity-30 uppercase tracking-[0.3em] mb-3 text-white">Speed Multiplier</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[1, 1.25, 1.5, 2].map(r => (
                      <button key={r} onClick={() => { setPlaybackRate(r); if (videoRef.current) videoRef.current.playbackRate = r; }} className={`py-2 rounded-xl text-[10px] font-black transition-all ${playbackRate === r ? 'accent-bg text-white shadow-[0_0_10px_var(--accent)]' : 'bg-white/5 text-white hover:bg-white/20'}`}>{r}x</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-4 bg-white/10 hover:bg-red-500 rounded-[20px] text-white transition-all backdrop-blur-3xl border border-white/20 shadow-2xl hover:scale-110 active:scale-90">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>

        {/* CENTER ENGINE CONTROLS */}
        <div className="absolute inset-0 flex items-center justify-center gap-16">
          <button onClick={(e) => skip(-skipTime, e)} className="pointer-events-auto p-8 rounded-full hover:bg-white/10 text-white transition-all active:scale-75 shadow-2xl group">
            <svg className="w-10 h-10 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M12.5 8c-2.65 0-5.05 1-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>
          </button>
          <button onClick={togglePlay} className="pointer-events-auto w-32 h-32 rounded-full bg-white/10 backdrop-blur-[30px] border-[3px] border-white/20 text-white flex items-center justify-center transition-all hover:scale-115 hover:bg-[var(--accent)] hover:border-transparent active:scale-90 shadow-[0_30px_60px_rgba(0,0,0,0.7)] group">
            {isPlaying ? (
              <svg className="w-14 h-14 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg className="w-14 h-14 translate-x-1 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>
          <button onClick={(e) => skip(skipTime, e)} className="pointer-events-auto p-8 rounded-full hover:bg-white/10 text-white transition-all active:scale-75 shadow-2xl group">
            <svg className="w-10 h-10 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M11.5 8c2.65 0 5.05 1 6.9 2.6L22 7v9h-9l3.62-3.62c-1.39-1.16-3.16-1.88-5.12-1.88-3.54 0-6.55 2.31-7.6 5.5l-2.37-.78C2.92 11.03 6.85 8 11.5 8z"/></svg>
          </button>
        </div>

        {/* BOTTOM DASHBOARD */}
        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/95 to-transparent pointer-events-auto">
          <div className="flex flex-col items-center mb-6">
            <div className="px-6 py-2 rounded-full bg-white/5 border border-white/15 backdrop-blur-3xl text-[11px] font-black tracking-[0.8em] text-white uppercase mb-4 shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
              {systemTime}
            </div>
            <div className="flex items-center gap-10">
              <button onClick={(e) => { e.stopPropagation(); const prevIdx = video.index - 1; if (prevIdx >= 0) onVideoChange(playlist.videos[prevIdx]); }} className="p-3 text-white/30 hover:text-white hover:scale-125 transition-all active:scale-90">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
              </button>
              <div className="text-center">
                 <h2 className="text-xl font-black tracking-tight text-white mb-1 line-clamp-1 max-w-xl drop-shadow-2xl">{video.title}</h2>
                 <p className="text-[9px] font-black uppercase tracking-[0.6em] opacity-40 text-white">{playlist.name} • TRACK {video.index + 1}/{playlist.videoCount}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); const nextIdx = video.index + 1; if (nextIdx < playlist.videos.length) onVideoChange(playlist.videos[nextIdx]); }} className="p-3 text-white/30 hover:text-white hover:scale-125 transition-all active:scale-90">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6 group">
            <span className="w-16 text-right text-[10px] font-mono font-bold opacity-60 text-white tabular-nums">{formatTime(currentTime)}</span>
            <div className="flex-1 relative flex items-center h-8">
               <input 
                 type="range"
                 min="0"
                 max={duration || 0}
                 step="0.01"
                 value={currentTime}
                 onChange={handleSeek}
                 className="custom-range w-full h-1.5 rounded-full appearance-none cursor-pointer group-hover:h-3 transition-all"
                 style={{
                    background: `linear-gradient(to right, var(--accent) ${(currentTime/duration)*100}%, rgba(255,255,255,0.08) ${(currentTime/duration)*100}%)`
                 }}
               />
            </div>
            <div className="flex items-center gap-4">
              <span className="w-16 text-left text-[10px] font-mono font-bold opacity-60 text-white tabular-nums">{formatTime(duration)}</span>
              <button onClick={toggleFullscreen} className="p-3 bg-white/5 hover:bg-[var(--accent)] rounded-[20px] transition-all text-white backdrop-blur-3xl border border-white/10 shadow-2xl hover:scale-115 active:scale-90">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 8V4h4m8 0h4v4m0 8h-4v4M8 20H4v-4" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>
        </div>

        <style>{`
          .custom-range::-webkit-slider-thumb {
            appearance: none;
            width: 18px;
            height: 18px;
            background: white;
            border-radius: 50%;
            box-shadow: 0 0 20px rgba(0,0,0,1), 0 0 5px var(--accent);
            cursor: pointer;
            border: 4px solid var(--accent);
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          .custom-range:hover::-webkit-slider-thumb {
            transform: scale(1.3);
            box-shadow: 0 0 30px var(--accent);
            background: var(--accent);
            border-color: white;
          }
        `}</style>
      </div>
    </div>
  );
};
