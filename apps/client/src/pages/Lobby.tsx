import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useStore";
import { lobbyService } from "../services";
import { getSocket } from "../hooks/useSocket";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Room {
  id: string;
  code: string;
  name: string;
  host: string;
  currentPlayers: number;
  maxPlayers: number;
  status: "waiting" | "in-progress" | "finished";
  isPublic: boolean;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: Room["status"] }) => {
  const styles: Record<Room["status"], string> = {
    waiting:
      "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse",
    "in-progress":
      "bg-amber-500/20 text-amber-300 border border-amber-500/40",
    finished:
      "bg-slate-500/20 text-slate-400 border border-slate-500/40",
  };
  const labels: Record<Room["status"], string> = {
    waiting: "⏳ Waiting",
    "in-progress": "🎨 Drawing",
    finished: "✅ Finished",
  };
  return (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
};

const PlayerBar = ({
  current,
  max,
}: {
  current: number;
  max: number;
}) => {
  const pct = Math.round((current / max) * 100);
  const color =
    pct >= 100
      ? "bg-rose-500"
      : pct >= 75
      ? "bg-amber-400"
      : "bg-violet-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-white/50 tabular-nums">
        {current}/{max}
      </span>
    </div>
  );
};

const RoomCard = ({
  room,
  onJoin,
}: {
  room: Room;
  onJoin: (code: string) => void;
}) => {
  const [copied, setCopied] = useState(false);
  const isFull = room.currentPlayers >= room.maxPlayers;
  const isActive = room.status === "in-progress";

  const copyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`group relative rounded-2xl border bg-white/5 backdrop-blur-sm p-4 flex flex-col gap-3 transition-all duration-300
        ${
          isFull || isActive
            ? "border-white/10 opacity-60 cursor-not-allowed"
            : "border-white/10 hover:border-violet-500/60 hover:bg-white/10 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-900/30"
        }`}
      onClick={() => !isFull && !isActive && onJoin(room.code)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-white truncate leading-tight">
            {room.name}
          </p>
          <p className="text-xs text-white/40 mt-0.5 truncate">
            by {room.host}
          </p>
        </div>
        <StatusBadge status={room.status} />
      </div>

      {/* Player bar */}
      <PlayerBar current={room.currentPlayers} max={room.maxPlayers} />

      {/* Footer */}
      <div className="flex items-center justify-between">
        <button
          onClick={copyCode}
          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors"
          title="Copy room code"
        >
          <span className="font-mono tracking-widest text-white/60">
            {room.code}
          </span>
          <span>{copied ? "✓" : "⎘"}</span>
        </button>

        {!isFull && !isActive && (
          <span className="text-xs font-semibold text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
            Join →
          </span>
        )}
        {isFull && (
          <span className="text-xs text-rose-400/70">Full</span>
        )}
      </div>
    </div>
  );
};

// ─── Modal: Create Room ────────────────────────────────────────────────────────

const CreateRoomModal = ({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string, maxPlayers: number, isPublic: boolean) => void;
}) => {
  const [name, setName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [isPublic, setIsPublic] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), maxPlayers, isPublic);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-extrabold text-white mb-1">
          🎨 Create a Room
        </h2>
        <p className="text-sm text-white/40 mb-6">
          Set up your drawing arena
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Room name */}
          <div>
            <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
              Room Name
            </label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Doodle Chaos 🌪️"
              maxLength={32}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition"
            />
          </div>

          {/* Max players */}
          <div>
            <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
              Max Players: {maxPlayers}
            </label>
            <input
              type="range"
              min={2}
              max={12}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
              className="w-full accent-violet-500"
            />
            <div className="flex justify-between text-xs text-white/30 mt-1">
              <span>2</span>
              <span>12</span>
            </div>
          </div>

          {/* Visibility */}
          <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-white/10">
            <div>
              <p className="text-sm font-semibold text-white">
                {isPublic ? "🌍 Public Room" : "🔒 Private Room"}
              </p>
              <p className="text-xs text-white/40">
                {isPublic
                  ? "Anyone can see and join"
                  : "Only joinable with code"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPublic((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${
                isPublic ? "bg-violet-600" : "bg-white/10"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                  isPublic ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm font-semibold hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition"
            >
              Create Room 🚀
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Lobby Page ───────────────────────────────────────────────────────────

export default function Lobby() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // ── Socket setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    // Load initial rooms from REST API
    const loadRooms = async () => {
      try {
        const initialRooms = await lobbyService.getPublicRooms()
        setRooms(initialRooms)
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to load rooms:', error)
        setIsLoading(false)
      }
    }

    loadRooms()

    const socket = getSocket()
    if (!socket) return

    socket.emit("lobby:join")

    // Listen for real-time room updates
    socket.on("lobby:rooms", (data: Room[]) => {
      setRooms(data)
      setIsLoading(false)
    })

    socket.on("lobby:online", (count: number) => {
      setOnlineCount(count)
    })

    socket.on("room:joined", ({ roomId }: { roomId: string }) => {
      navigate(`/room/${roomId}`)
    })

    socket.on("room:error", ({ message }: { message: string }) => {
      setJoinError(message)
    })

    return () => {
      socket.off("lobby:rooms")
      socket.off("lobby:online")
      socket.off("room:joined")
      socket.off("room:error")
      socket.emit("lobby:leave")
    }
  }, [navigate])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setJoinError("");

    // Validate room code using REST API
    const validation = await lobbyService.validateRoomCode(joinCode.trim());
    if (!validation || !validation.joinable) {
      setJoinError(validation?.reason || "Unable to join this room");
      return;
    }

    // If validation passes, emit socket event to join
    const socket = getSocket();
    socket?.emit("room:join", { code: joinCode.trim().toUpperCase() });
  };

  const handleJoinRoom = (code: string) => {
    setJoinError("");
    const socket = getSocket();
    socket?.emit("room:join", { code });
  };

  const handleCreateRoom = (
    name: string,
    maxPlayers: number,
    isPublic: boolean
  ) => {
    const socket = getSocket();
    socket?.emit("room:create", { name, maxPlayers, isPublic });
    setShowCreate(false);
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  const publicRooms = rooms.filter((r) => r.isPublic);
  const waitingRooms = publicRooms.filter((r) => r.status === "waiting");
  const activeRooms = publicRooms.filter((r) => r.status === "in-progress");

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      {/* Ambient background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-700/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-80 h-80 bg-fuchsia-700/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-indigo-700/15 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <header className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-3xl">🖍️</span>
              <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                Scribble
              </h1>
            </div>
            <p className="text-white/40 text-sm">
              Welcome back,{" "}
              <span className="text-white/70 font-semibold">
                {user?.username ?? "player"}
              </span>{" "}
              👋
            </p>
          </div>

          {/* Online count pill */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-white/70">
              <span className="font-bold text-white">{onlineCount}</span>{" "}
              online
            </span>
          </div>
        </header>

        {/* ── Action Bar ───────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Join by code */}
          <form
            onSubmit={handleJoinByCode}
            className="flex-1 flex gap-2 bg-white/5 border border-white/10 rounded-2xl p-2"
          >
            <input
              type="text"
              value={joinCode}
              onChange={(e) => {
                setJoinCode(e.target.value.toUpperCase());
                setJoinError("");
              }}
              placeholder="Enter room code…"
              maxLength={8}
              className="flex-1 bg-transparent px-3 py-1.5 text-white placeholder-white/20 font-mono tracking-widest text-sm focus:outline-none"
            />
            <button
              type="submit"
              disabled={!joinCode.trim()}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition"
            >
              Join
            </button>
          </form>

          {/* Create room */}
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold text-sm shadow-lg shadow-violet-900/40 transition-all duration-200 hover:-translate-y-0.5"
          >
            <span className="text-base">✏️</span>
            Create Room
          </button>
        </div>

        {/* Join error */}
        {joinError && (
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-rose-300 text-sm">
            <span>⚠️</span>
            <span>{joinError}</span>
          </div>
        )}

        {/* ── Room Lists ───────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-white/30">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Finding rooms…</p>
          </div>
        ) : publicRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <span className="text-5xl">🏜️</span>
            <p className="text-white/50 font-semibold">No rooms yet</p>
            <p className="text-white/30 text-sm">
              Be the first to create one!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">

            {/* Waiting rooms */}
            {waitingRooms.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest">
                    Open Rooms
                  </h2>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                    {waitingRooms.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {waitingRooms.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      onJoin={handleJoinRoom}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* In-progress rooms */}
            {activeRooms.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest">
                    In Progress
                  </h2>
                  <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold">
                    {activeRooms.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {activeRooms.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      onJoin={handleJoinRoom}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* ── Create Room Modal ─────────────────────────────────────────────── */}
      {showCreate && (
        <CreateRoomModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreateRoom}
        />
      )}
    </div>
  );
}
