// ─── Auth ────────────────────────────────────────────────────────────────────
export interface User {
  id: string
  username: string
  email: string
  avatar?: string
  createdAt: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  username: string
  email: string
  password: string
}

// ─── Room ────────────────────────────────────────────────────────────────────
export type RoomState = 'waiting' | 'picking' | 'drawing' | 'round_end' | 'game_over'

export interface Player {
  id: string          // socket id
  userId: string
  username: string
  avatar?: string
  score: number
  isDrawing: boolean
  hasGuessed: boolean
}

export interface Room {
  id: string
  name: string
  hostId: string
  players: Player[]
  state: RoomState
  round: number
  maxRounds: number
  maxPlayers: number
  timeLeft: number
  word?: string        // only sent to drawer
  wordHint?: string    // underscores like "_ _ _ _ _"
  drawerId?: string
  code?: string        // room code for joining
  isPublic?: boolean   // whether room is visible in lobby
}

// ─── Lobby Room (display in lobby list) ───────────────────────────────────────
export interface LobbyRoom {
  id: string
  code: string
  name: string
  host: string
  currentPlayers: number
  maxPlayers: number
  status: 'waiting' | 'in-progress' | 'finished'
  isPublic: boolean
}

// ─── Socket events — Client → Server ─────────────────────────────────────────
export interface ClientEvents {
  'lobby:join': () => void
  'lobby:leave': () => void
  'room:create': (payload: { name: string; maxPlayers: number; isPublic: boolean }) => void
  'room:join': (payload: { code: string }) => void
  join_room: (payload: { roomId: string; token: string }) => void
  create_room: (payload: { name: string; maxPlayers: number; maxRounds: number; token: string }) => void
  leave_room: () => void
  start_game: () => void
  draw: (data: DrawData) => void
  send_guess: (payload: { message: string }) => void
  clear_canvas: () => void
  undo: () => void
}

// ─── Socket events — Server → Client ─────────────────────────────────────────
export interface ServerEvents {
  'lobby:rooms': (rooms: LobbyRoom[]) => void
  'lobby:online': (count: number) => void
  'room:joined': (payload: { roomId: string }) => void
  'room:error': (payload: { message: string }) => void
  room_joined: (room: Room) => void
  room_created: (room: Room) => void
  room_updated: (room: Room) => void
  player_joined: (player: Player) => void
  player_left: (playerId: string) => void
  game_started: () => void
  round_start: (payload: { round: number; drawerId: string; wordHint: string; word?: string; timeLeft: number }) => void
  round_end: (payload: { word: string; scores: Record<string, number> }) => void
  game_over: (payload: { scores: Record<string, number>; winner: Player }) => void
  draw: (data: DrawData) => void
  canvas_cleared: () => void
  canvas_undo: (strokes: DrawData[][]) => void
  chat_message: (msg: ChatMessage) => void
  correct_guess: (payload: { playerId: string; username: string; score: number }) => void
  timer_tick: (timeLeft: number) => void
  error: (msg: string) => void
}

// ─── Drawing ─────────────────────────────────────────────────────────────────
export interface DrawData {
  x: number
  y: number
  prevX: number
  prevY: number
  color: string
  brushSize: number
  tool: 'pen' | 'eraser' | 'fill'
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string
  playerId: string
  username: string
  message: string
  type: 'chat' | 'system' | 'correct_guess'
  timestamp: number
}
