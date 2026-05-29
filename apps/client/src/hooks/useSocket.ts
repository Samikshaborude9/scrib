import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore, useGameStore } from '../store/useStore'
import { DrawData, Room, ChatMessage, Player } from '@scribble/types'

let socketInstance: Socket | null = null

export function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io('http://localhost:5000', { autoConnect: false })
  }
  return socketInstance
}

interface UseSocketOptions {
  onDraw?:   (data: DrawData) => void
  onClear?:  () => void
  onUndo?:   (strokes: DrawData[][]) => void
}

export function useSocket(options: UseSocketOptions = {}) {
  const { token, user } = useAuthStore()
  const { setRoom, clearRoom, addMessage, setWordHint, setWord, setTimeLeft, setIsDrawer } = useGameStore()
  const optionsRef = useRef(options)
  optionsRef.current = options

  useEffect(() => {
    if (!token) return
    const socket = getSocket()
    if (!socket.connected) socket.connect()

    const on = socket.on.bind(socket)

    on('room_created',  (room: Room)   => setRoom(room))
    on('room_joined',   (room: Room)   => setRoom(room))
    on('room_updated',  (room: Room)   => setRoom(room))

    on('player_joined', (player: Player) => {
      const sys: ChatMessage = {
        id: Date.now().toString(), playerId: 'system', username: 'system',
        message: `${player.username} joined the room`,
        type: 'system', timestamp: Date.now(),
      }
      addMessage(sys)
    })

    on('player_left', (playerId: string) => {
      const room = useGameStore.getState().room
      const p = room?.players.find(pl => pl.id === playerId)
      if (p) {
        const sys: ChatMessage = {
          id: Date.now().toString(), playerId: 'system', username: 'system',
          message: `${p.username} left the room`,
          type: 'system', timestamp: Date.now(),
        }
        addMessage(sys)
      }
    })

    on('round_start', ({ round, drawerId, wordHint, word, timeLeft }) => {
      const myId = socket.id
      const isDrawer = myId === drawerId
      setIsDrawer(isDrawer)
      setWordHint(wordHint)
      setWord(word || '')
      setTimeLeft(timeLeft)
      const sys: ChatMessage = {
        id: Date.now().toString(), playerId: 'system', username: 'system',
        message: `Round ${round} started!`,
        type: 'system', timestamp: Date.now(),
      }
      addMessage(sys)
    })

    on('round_end', ({ word }) => {
      setWord('')
      setWordHint('')
      const sys: ChatMessage = {
        id: Date.now().toString(), playerId: 'system', username: 'system',
        message: `Round over! The word was "${word}"`,
        type: 'system', timestamp: Date.now(),
      }
      addMessage(sys)
    })

    on('game_over', ({ winner }) => {
      const sys: ChatMessage = {
        id: Date.now().toString(), playerId: 'system', username: 'system',
        message: `Game over! ${winner.username} wins with ${winner.score} points!`,
        type: 'system', timestamp: Date.now(),
      }
      addMessage(sys)
    })

    on('timer_tick',     (t: number)      => setTimeLeft(t))
    on('chat_message',   (msg: ChatMessage) => addMessage(msg))
    on('draw',           (data: DrawData)  => optionsRef.current.onDraw?.(data))
    on('canvas_cleared', ()               => optionsRef.current.onClear?.())
    on('canvas_undo',    (s: DrawData[][]) => optionsRef.current.onUndo?.(s))

    on('error', (msg: string) => console.error('Socket error:', msg))

    return () => {
      socket.removeAllListeners()
    }
  }, [token])

  const createRoom = useCallback((name: string, maxPlayers: number, maxRounds: number) => {
    getSocket().emit('create_room', { name, maxPlayers, maxRounds, token })
  }, [token])

  const joinRoom = useCallback((roomId: string) => {
    getSocket().emit('join_room', { roomId, token })
  }, [token])

  const startGame = useCallback(() => {
    getSocket().emit('start_game')
  }, [])

  const sendDraw = useCallback((data: DrawData) => {
    getSocket().emit('draw', data)
  }, [])

  const commitStroke = useCallback(() => {
    getSocket().emit('commit_stroke')
  }, [])

  const sendGuess = useCallback((message: string) => {
    getSocket().emit('send_guess', { message })
  }, [])

  const clearCanvas = useCallback(() => {
    getSocket().emit('clear_canvas')
  }, [])

  const undoCanvas = useCallback(() => {
    getSocket().emit('undo')
  }, [])

  const getRooms = useCallback(() => {
    getSocket().emit('get_rooms')
  }, [])

  return {
    socket: getSocket(),
    createRoom, joinRoom, startGame,
    sendDraw, commitStroke, sendGuess,
    clearCanvas, undoCanvas, getRooms,
  }
}
