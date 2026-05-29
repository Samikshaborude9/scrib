import { v4 as uuid } from 'uuid'
import { Room as IRoom, Player, RoomState, DrawData } from '@scribble/types'
import { WORD_LIST } from '../game/words'

const TURN_DURATION = 80  // seconds
const ROUND_END_PAUSE = 5 // seconds

export class Room {
  id: string
  code: string
  name: string
  hostId: string
  hostName: string
  players: Player[]
  state: RoomState
  round: number
  maxRounds: number
  maxPlayers: number
  timeLeft: number
  word: string
  wordHint: string
  drawerId: string | undefined
  isPublic: boolean
  strokes: DrawData[][]     // for undo — array of strokes, each stroke is array of points
  currentStroke: DrawData[]

  private timer: ReturnType<typeof setInterval> | null = null
  private onTick:     (timeLeft: number) => void
  private onRoundEnd: (word: string, scores: Record<string, number>) => void
  private onGameOver: (scores: Record<string, number>, winner: Player) => void
  private onRoundStart: (drawerId: string, word: string, hint: string, timeLeft: number) => void

  constructor(
    name: string,
    hostId: string,
    hostName: string,
    maxPlayers: number,
    maxRounds: number,
    isPublic: boolean = true,
    callbacks: {
      onTick: (timeLeft: number) => void
      onRoundEnd: (word: string, scores: Record<string, number>) => void
      onGameOver: (scores: Record<string, number>, winner: Player) => void
      onRoundStart: (drawerId: string, word: string, hint: string, timeLeft: number) => void
    }
  ) {
    this.id         = uuid().slice(0, 6).toUpperCase()
    this.code       = this.generateCode()
    this.name       = name
    this.hostId     = hostId
    this.hostName   = hostName
    this.players    = []
    this.state      = 'waiting'
    this.round      = 0
    this.maxRounds  = maxRounds
    this.maxPlayers = maxPlayers
    this.timeLeft   = 0
    this.word       = ''
    this.wordHint   = ''
    this.isPublic   = isPublic
    this.strokes    = []
    this.currentStroke = []

    this.onTick       = callbacks.onTick
    this.onRoundEnd   = callbacks.onRoundEnd
    this.onGameOver   = callbacks.onGameOver
    this.onRoundStart = callbacks.onRoundStart
  }

  /**
   * Generate a random 6-character room code
   */
  private generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  // ─── Players ───────────────────────────────────────────────────────────────

  addPlayer(player: Player) {
    this.players.push(player)
  }

  removePlayer(socketId: string) {
    this.players = this.players.filter(p => p.id !== socketId)
    if (this.drawerId === socketId) {
      this.stopTimer()
      // next round after short pause
      setTimeout(() => this.nextTurn(), 2000)
    }
  }

  getPlayer(socketId: string) {
    return this.players.find(p => p.id === socketId)
  }

  isFull() {
    return this.players.length >= this.maxPlayers
  }

  // ─── Game flow ─────────────────────────────────────────────────────────────

  startGame() {
    this.round = 0
    this.players.forEach(p => { p.score = 0 })
    this.nextTurn()
  }

  nextTurn() {
    if (this.players.length < 2) return

    // Advance round when all players have drawn
    const drawerIndex = this.drawerId
      ? this.players.findIndex(p => p.id === this.drawerId)
      : -1
    const nextIndex = (drawerIndex + 1) % this.players.length

    if (nextIndex === 0) {
      this.round++
    }

    if (this.round > this.maxRounds) {
      this.endGame()
      return
    }

    const drawer = this.players[nextIndex]
    this.drawerId = drawer.id

    this.players.forEach(p => {
      p.isDrawing  = p.id === drawer.id
      p.hasGuessed = false
    })

    this.word     = this.pickWord()
    this.wordHint = this.makeHint(this.word)
    this.strokes  = []
    this.currentStroke = []
    this.state    = 'drawing'
    this.timeLeft = TURN_DURATION

    this.onRoundStart(drawer.id, this.word, this.wordHint, this.timeLeft)
    this.startTimer()
  }

  private startTimer() {
    this.stopTimer()
    this.timer = setInterval(() => {
      this.timeLeft--
      this.onTick(this.timeLeft)
      if (this.timeLeft <= 0) {
        this.stopTimer()
        this.endTurn()
      }
    }, 1000)
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  private endTurn() {
    this.state = 'round_end'
    const scores = this.getScoreMap()
    this.onRoundEnd(this.word, scores)
    setTimeout(() => this.nextTurn(), ROUND_END_PAUSE * 1000)
  }

  private endGame() {
    this.stopTimer()
    this.state = 'game_over'
    const scores = this.getScoreMap()
    const winner = [...this.players].sort((a, b) => b.score - a.score)[0]
    this.onGameOver(scores, winner)
  }

  // ─── Guessing ──────────────────────────────────────────────────────────────

  checkGuess(socketId: string, guess: string): boolean {
    if (this.state !== 'drawing') return false
    if (socketId === this.drawerId) return false
    const player = this.getPlayer(socketId)
    if (!player || player.hasGuessed) return false

    if (guess.trim().toLowerCase() === this.word.toLowerCase()) {
      player.hasGuessed = true
      // score = time remaining bonus
      const bonus = Math.floor((this.timeLeft / TURN_DURATION) * 400) + 100
      player.score += bonus
      // give drawer points too
      const drawer = this.getPlayer(this.drawerId || '')
      if (drawer) drawer.score += 50

      const allGuessed = this.players
        .filter(p => p.id !== this.drawerId)
        .every(p => p.hasGuessed)
      if (allGuessed) {
        this.stopTimer()
        this.endTurn()
      }
      return true
    }
    return false
  }

  // ─── Drawing ───────────────────────────────────────────────────────────────

  addDrawData(data: DrawData) {
    this.currentStroke.push(data)
  }

  commitStroke() {
    if (this.currentStroke.length > 0) {
      this.strokes.push([...this.currentStroke])
      this.currentStroke = []
    }
  }

  undoLastStroke(): DrawData[][] {
    this.strokes.pop()
    return this.strokes
  }

  clearCanvas() {
    this.strokes = []
    this.currentStroke = []
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private pickWord(): string {
    return WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)]
  }

  private makeHint(word: string): string {
    return word.split('').map(c => (c === ' ' ? ' ' : '_')).join(' ')
  }

  private getScoreMap(): Record<string, number> {
    return Object.fromEntries(this.players.map(p => [p.id, p.score]))
  }

  toJSON(): IRoom {
    return {
      id: this.id,
      name: this.name,
      hostId: this.hostId,
      players: this.players,
      state: this.state,
      round: this.round,
      maxRounds: this.maxRounds,
      maxPlayers: this.maxPlayers,
      timeLeft: this.timeLeft,
      wordHint: this.wordHint,
      drawerId: this.drawerId,
      code: this.code,
      isPublic: this.isPublic,
    }
  }
}
