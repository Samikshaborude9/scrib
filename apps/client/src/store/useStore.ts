import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, Room, ChatMessage, DrawData } from '@scribble/types'

// ─── Auth slice ────────────────────────────────────────────────────────────────
interface AuthState {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:  null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      clearAuth: () => set({ user: null, token: null }),
    }),
    { name: 'scribble-auth' }
  )
)

// ─── Game slice ────────────────────────────────────────────────────────────────
interface GameState {
  room:        Room | null
  messages:    ChatMessage[]
  wordHint:    string
  word:        string      // only set for the drawer
  timeLeft:    number
  isDrawer:    boolean

  setRoom:     (room: Room) => void
  clearRoom:   () => void
  addMessage:  (msg: ChatMessage) => void
  setWordHint: (hint: string) => void
  setWord:     (word: string) => void
  setTimeLeft: (t: number) => void
  setIsDrawer: (v: boolean) => void
  updateScore: (playerId: string, score: number) => void
}

export const useGameStore = create<GameState>((set) => ({
  room:      null,
  messages:  [],
  wordHint:  '',
  word:      '',
  timeLeft:  0,
  isDrawer:  false,

  setRoom:     (room)    => set({ room }),
  clearRoom:   ()        => set({ room: null, messages: [], wordHint: '', word: '', timeLeft: 0, isDrawer: false }),
  addMessage:  (msg)     => set(s => ({ messages: [...s.messages.slice(-200), msg] })),
  setWordHint: (hint)    => set({ wordHint: hint }),
  setWord:     (word)    => set({ word }),
  setTimeLeft: (t)       => set({ timeLeft: t }),
  setIsDrawer: (v)       => set({ isDrawer: v }),
  updateScore: (id, score) =>
    set(s => ({
      room: s.room
        ? { ...s.room, players: s.room.players.map(p => p.id === id ? { ...p, score } : p) }
        : null,
    })),
}))

// ─── Canvas / drawing slice ────────────────────────────────────────────────────
interface CanvasState {
  color:      string
  brushSize:  number
  tool:       DrawData['tool']
  setColor:   (c: string) => void
  setBrush:   (s: number) => void
  setTool:    (t: DrawData['tool']) => void
}

export const useCanvasStore = create<CanvasState>((set) => ({
  color:     '#1a1a1a',
  brushSize: 6,
  tool:      'pen',
  setColor:  (c) => set({ color: c }),
  setBrush:  (s) => set({ brushSize: s }),
  setTool:   (t) => set({ tool: t }),
}))
