import { useCallback, useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  RefreshCw,
} from "lucide-react";
import { withAuthToken } from "@/utils/media";

function VideoPlayer({
  width = "100%",
  height = "100%",
  url,
  onProgressUpdate, // اختیاریه
  progressData,
  thumbnail,
}) {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [ended, setEnded] = useState(false);

  const playerRef = useRef(null);
  const playerContainerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // فقط اگه تابع باشه صدا بزن
  const safeProgressUpdate = (data) => {
    if (typeof onProgressUpdate === "function") {
      onProgressUpdate(data);
    }
  };

  const handleEnded = () => {
    setEnded(true);
    setPlaying(false);
    safeProgressUpdate({
      ...progressData,
      progressValue: 1,
    });
  };

  const handleReplay = () => {
    setEnded(false);
    setPlaying(true);
    playerRef.current?.seekTo(0);
  };

  const handlePlayPause = () => {
    if (ended) handleReplay();
    else setPlaying(!playing);
  };

  const handleProgress = (state) => {
    if (!seeking) setPlayed(state.played);

    // فقط وقتی به 90% رسید علامت بزن
    if (state.played >= 0.9 && state.played < 1) {
      safeProgressUpdate({
        ...progressData,
        progressValue: state.played,
      });
    }
  };

  const handleRewind = () => playerRef.current?.seekTo(playerRef.current.getCurrentTime() - 10);
  const handleForward = () => playerRef.current?.seekTo(playerRef.current.getCurrentTime() + 10);

  const handleSeekChange = (val) => {
    setPlayed(val[0]);
    setSeeking(true);
  };

  const handleSeekMouseUp = () => {
    setSeeking(false);
    playerRef.current?.seekTo(played);
  };

  const handleVolumeChange = (val) => setVolume(val[0]);

  const pad = (n) => ("0" + n).slice(-2);
  const formatTime = (seconds) => {
    if (!seconds) return "0:00";
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = pad(date.getUTCSeconds());
    return hh ? `${hh}:${pad(mm)}:${ss}` : `${mm}:${ss}`;
  };

  const handleFullScreen = useCallback(() => {
    if (!document.fullscreenElement) {
      playerContainerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  };

  useEffect(() => {
    const handler = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const resolvedUrl = withAuthToken(url);

  return (
    <div
      ref={playerContainerRef}
      className="relative bg-black overflow-hidden group"
      style={{ width, height }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* پس‌زمینه محو */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-xl scale-110 opacity-30"
        style={{
          backgroundImage: thumbnail
            ? `url(${thumbnail})`
            : "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
        }}
      />

      <ReactPlayer
        ref={playerRef}
        width="100%"
        height="100%"
        url={resolvedUrl}
        playing={playing}
        volume={volume}
        muted={muted}
        onProgress={handleProgress}
        onEnded={handleEnded}
        progressInterval={1000}
      />

      {/* صفحه پایان ویدیو */}
      {ended && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="text-center">
            <RefreshCw className="h-16 w-16 text-white mx-auto mb-4" />
            <p className="text-2xl font-bold text-white mb-6">پایان ویدیو</p>
            <Button onClick={handleReplay} size="lg" className="bg-blue-600 hover:bg-blue-700">
              <RefreshCw className="h-6 w-6 ml-2" />
              پخش مجدد
            </Button>
          </div>
        </div>
      )}

      {/* کنترل‌ها */}
      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4 transition-all duration-300 ${
          showControls || ended ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0"
        }`}
      >
        <Slider
          value={[played * 100]}
          max={100}
          step={0.1}
          onValueChange={(v) => handleSeekChange([v[0] / 100])}
          onValueCommit={handleSeekMouseUp}
          className="mb-4"
        />

        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handlePlayPause}>
              {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
            </Button>

            <Button variant="ghost" size="icon" onClick={handleRewind}>
              <RotateCcw className="h-5 w-5" />
              <span className="text-xs ml-1">-10</span>
            </Button>

            <Button variant="ghost" size="icon" onClick={handleForward}>
              <RotateCw className="h-5 w-5" />
              <span className="text-xs ml-1">+10</span>
            </Button>

            <Button variant="ghost" size="icon" onClick={() => setMuted(!muted)}>
              {muted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>

            <div className="w-24">
              <Slider value={[volume * 100]} onValueChange={(v) => handleVolumeChange([v[0] / 100])} />
            </div>

            <span className="text-sm">
              {formatTime(played * (playerRef.current?.getDuration() || 0))} / {formatTime(playerRef.current?.getDuration() || 0)}
            </span>
          </div>

          <Button variant="ghost" size="icon" onClick={handleFullScreen}>
            {isFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;
