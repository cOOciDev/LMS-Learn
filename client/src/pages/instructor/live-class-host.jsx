import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";
import {
  fetchInstructorLiveClassByIdService,
} from "@/services";
import { AuthContext } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Loader2, Mic, MicOff, Video as VideoIcon, VideoOff, MonitorUp, PhoneOff, Users, Send } from "lucide-react";

function LiveClassHostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const localVideoRef = useRef(null);
  const socketRef = useRef(null);
  const chatBottomRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetchInstructorLiveClassByIdService(id);
        if (response?.success) {
          setSession(response.data);
          setError("");
        } else {
          setError("Unable to load live class.");
        }
      } catch (err) {
        setError(err?.response?.data?.message || "Unable to load live class.");
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [id]);

  useEffect(() => {
    const initLocalMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        streamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Media device error:", err);
        setError("Unable to access camera/microphone.");
      }
    };

    initLocalMedia();

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!auth?.token || !session) return;

    const socket = io(import.meta.env.VITE_API_URL, {
      auth: { token: auth.token },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);
      socket.emit("live-class:join", {
        room: `live-class:${id}`,
        role: "instructor",
      });
      addSystemMessage("You joined the session");
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
      addSystemMessage("Disconnected from session");
    });

    // TODO: integrate WebRTC signaling events for remote participants
    socket.on("live-class:participants", (list) => {
      setParticipants(list || []);
    });

    socket.on("live-class:chat:message", (payload) => {
      setMessages((prev) => [...prev, payload]);
    });

    socket.on("live-class:system", (payload) => {
      addSystemMessage(payload?.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [auth?.token, session, id]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const addSystemMessage = (text) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        type: "system",
        text,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const handleSendMessage = () => {
    if (!chatInput.trim() || !socketRef.current) return;
    const payload = {
      id: Date.now(),
      text: chatInput.trim(),
      sender: auth?.user?.userName || "Instructor",
      timestamp: new Date().toISOString(),
    };

    socketRef.current.emit("live-class:chat:message", {
      room: `live-class:${id}`,
      message: payload.text,
    });

    setMessages((prev) => [...prev, { ...payload, self: true }]);
    setChatInput("");
  };

  const toggleMic = () => {
    setIsMicOn((prev) => {
      const next = !prev;
      streamRef.current?.getAudioTracks().forEach((track) => {
        track.enabled = next;
      });
      return next;
    });
  };

  const toggleCamera = () => {
    setIsCameraOn((prev) => {
      const next = !prev;
      streamRef.current?.getVideoTracks().forEach((track) => {
        track.enabled = next;
      });
      return next;
    });
  };

  const handleShareScreen = () => {
    // TODO: implement screen sharing negotiation
    alert("Screen sharing setup coming soon.");
  };

  const confirmEndClass = () => setShowEndConfirm(true);
  const cancelEndClass = () => setShowEndConfirm(false);

  const endClass = () => {
    if (socketRef.current) {
      socketRef.current.emit("live-class:end", { room: `live-class:${id}` });
    }
    navigate("/instructor/live-classes");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-950 text-white">
        <p className="mb-4 text-lg">{error || "Live class not available"}</p>
        <Button onClick={() => navigate("/instructor/live-classes")}>
          Back to Live Classes
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-slate-900 text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div>
          <p className="text-sm text-white/70">
            Live now • {session.timezone}
          </p>
          <h1 className="text-2xl font-semibold">{session.title}</h1>
        </div>
        <div className="text-sm text-white/60">
          Participants: {participants.length}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <section className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="relative h-72 rounded-2xl bg-slate-800">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full rounded-2xl object-cover"
              />
              <div className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-sm">
                {auth?.user?.userName || "Instructor"}
              </div>
            </div>

          {/* TODO: map remote participants once WebRTC signaling is ready */}
            <div className="flex h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 text-white/60">
              <Users className="mb-3 h-10 w-10" />
              <p>Remote participant video will appear here</p>
              <p className="text-xs">Waiting for attendees…</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 p-4">
            <h2 className="mb-3 text-lg font-semibold">Participants</h2>
            {participants.length === 0 ? (
              <p className="text-sm text-white/60">No participants yet.</p>
            ) : (
              <ul className="space-y-2 text-sm text-white/80">
                {participants.map((participant) => (
                  <li
                    key={participant.id}
                    className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
                  >
                    <span>{participant.name || participant.id}</span>
                    <span className="text-xs text-white/60">
                      {participant.status || "connected"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <aside className="flex w-full max-w-md flex-col border-l border-white/10 bg-slate-950/50">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h2 className="text-lg font-semibold">Chat</h2>
            <span className={`text-xs ${socketConnected ? "text-emerald-400" : "text-red-400"}`}>
              {socketConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
              {messages.map((msg) => (
                <div
                  key={msg.id || msg.timestamp}
                  className={`rounded-2xl px-4 py-2 text-sm ${
                    msg.type === "system"
                      ? "bg-white/5 text-white/70 text-center text-xs"
                      : msg.self
                      ? "ml-auto w-fit bg-primary text-white"
                      : "bg-slate-800 text-white"
                  }`}
                >
                  {msg.type !== "system" && (
                    <p className="text-xs text-white/70">
                      {msg.sender || "Unknown"} •{" "}
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  )}
                  <p>{msg.text}</p>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>
            <div className="border-t border-white/10 p-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={
                    socketConnected ? "Type a message…" : "Disconnected"
                  }
                  disabled={!socketConnected}
                  className="flex-1 rounded-2xl bg-slate-800 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button
                  size="icon"
                  className="rounded-full"
                  disabled={!socketConnected || !chatInput.trim()}
                  onClick={handleSendMessage}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <footer className="flex flex-wrap items-center justify-center gap-4 border-t border-white/10 px-6 py-4">
        <Button
          variant={isMicOn ? "secondary" : "destructive"}
          onClick={toggleMic}
          className="flex items-center gap-2 rounded-full px-4"
        >
          {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          {isMicOn ? "Mic On" : "Mic Off"}
        </Button>
        <Button
          variant={isCameraOn ? "secondary" : "destructive"}
          onClick={toggleCamera}
          className="flex items-center gap-2 rounded-full px-4"
        >
          {isCameraOn ? (
            <VideoIcon className="h-4 w-4" />
          ) : (
            <VideoOff className="h-4 w-4" />
          )}
          {isCameraOn ? "Camera On" : "Camera Off"}
        </Button>
        <Button
          variant="secondary"
          onClick={handleShareScreen}
          className="flex items-center gap-2 rounded-full px-4"
        >
          <MonitorUp className="h-4 w-4" />
          Share Screen
        </Button>
        <Button
          variant="destructive"
          onClick={confirmEndClass}
          className="flex items-center gap-2 rounded-full px-4"
        >
          <PhoneOff className="h-4 w-4" />
          End Class
        </Button>
      </footer>

      {showEndConfirm && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 p-6 text-center">
            <h3 className="text-xl font-semibold text-white">
              End live class?
            </h3>
            <p className="mt-2 text-sm text-white/70">
              Students will be disconnected immediately.
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <Button variant="secondary" onClick={cancelEndClass}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={endClass}>
                End Class
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LiveClassHostPage;

