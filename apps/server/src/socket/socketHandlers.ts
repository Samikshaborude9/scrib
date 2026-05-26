import { Server, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { v4 as uuid } from 'uuid'
import { RoomManager } from '../rooms/RoomManager'
import { Player } from '@scribble/types'

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret'

export function registerSocketHandlers(io: Server) {
  const roomManager = new RoomManager(io)

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`)

    // ─── Auth helper ────────────────────────────────────────────────────────
    function getAuthUser(token: string): { userId: string; username: string } | null {
      try {
        return jwt.verify(token, JWT_SECRET) as { userId: string; username: string }
      } catch {
        return null
      }
    }

    // ─── Create room ────────────────────────────────────────────────────────
    socket.on('create_room', ({ name, maxPlayers, maxRounds, token }) => {
      const user = getAuthUser(token)
      if (!user) { socket.emit('error', 'Unauthorized'); return }

      const room = roomManager.createRoom(
        name || `${user.username}'s room`,
        socket.id,
        maxPlayers || 8,
        maxRounds  || 3
      )

      const player: Player = {
        id: socket.id, userId: user.userId, username: user.username,
        score: 0, isDrawing: false, hasGuessed: false,
      }
      room.addPlayer(player)
      socket.join(room.id)
      socket.emit('room_created', room.toJSON())
      console.log(`🏠 Room created: ${room.id} by ${user.username}`)
    })

    // ─── Join room ──────────────────────────────────────────────────────────
    socket.on('join_room', ({ roomId, token }) => {
      const user = getAuthUser(token)
      if (!user) { socket.emit('error', 'Unauthorized'); return }

      const room = roomManager.getRoom(roomId)
      if (!room) { socket.emit('error', 'Room not found'); return }
      if (room.isFull()) { socket.emit('error', 'Room is full'); return }

      const player: Player = {
        id: socket.id, userId: user.userId, username: user.username,
        score: 0, isDrawing: false, hasGuessed: false,
      }
      room.addPlayer(player)
      socket.join(room.id)

      socket.emit('room_joined', room.toJSON())
      socket.to(room.id).emit('player_joined', player)
      io.to(room.id).emit('room_updated', room.toJSON())
      console.log(`👤 ${user.username} joined room ${room.id}`)
    })

    // ─── Get open rooms ─────────────────────────────────────────────────────
    socket.on('get_rooms', () => {
      const rooms = roomManager.getOpenRooms().map(r => r.toJSON())
      socket.emit('rooms_list', rooms)
    })

    // ─── Start game ─────────────────────────────────────────────────────────
    socket.on('start_game', () => {
      const room = roomManager.getRoomBySocketId(socket.id)
      if (!room) return
      if (room.hostId !== socket.id) { socket.emit('error', 'Only host can start'); return }
      if (room.players.length < 2) { socket.emit('error', 'Need at least 2 players'); return }

      room.startGame()
      io.to(room.id).emit('game_started')
    })

    // ─── Drawing ────────────────────────────────────────────────────────────
    socket.on('draw', (data) => {
      const room = roomManager.getRoomBySocketId(socket.id)
      if (!room || room.drawerId !== socket.id) return
      room.addDrawData(data)
      socket.to(room.id).emit('draw', data)
    })

    socket.on('commit_stroke', () => {
      const room = roomManager.getRoomBySocketId(socket.id)
      if (!room || room.drawerId !== socket.id) return
      room.commitStroke()
    })

    socket.on('clear_canvas', () => {
      const room = roomManager.getRoomBySocketId(socket.id)
      if (!room || room.drawerId !== socket.id) return
      room.clearCanvas()
      io.to(room.id).emit('canvas_cleared')
    })

    socket.on('undo', () => {
      const room = roomManager.getRoomBySocketId(socket.id)
      if (!room || room.drawerId !== socket.id) return
      const strokes = room.undoLastStroke()
      io.to(room.id).emit('canvas_undo', strokes)
    })

    // ─── Chat / Guess ────────────────────────────────────────────────────────
    socket.on('send_guess', ({ message }) => {
      const room = roomManager.getRoomBySocketId(socket.id)
      if (!room) return
      const player = room.getPlayer(socket.id)
      if (!player) return

      const isCorrect = room.checkGuess(socket.id, message)

      if (isCorrect) {
        io.to(room.id).emit('correct_guess', {
          playerId: socket.id,
          username: player.username,
          score: player.score,
        })
        const sysMsg = {
          id: uuid(), playerId: 'system', username: 'system',
          message: `${player.username} guessed the word!`,
          type: 'correct_guess' as const, timestamp: Date.now(),
        }
        io.to(room.id).emit('chat_message', sysMsg)
      } else {
        // Broadcast chat (not to self — client adds own messages optimistically)
        const chatMsg = {
          id: uuid(), playerId: socket.id, username: player.username,
          message, type: 'chat' as const, timestamp: Date.now(),
        }
        io.to(room.id).emit('chat_message', chatMsg)
      }
    })

    // ─── Disconnect ─────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`)
      const roomId = roomManager.removePlayerFromRoom(socket.id)
      if (roomId) {
        const room = roomManager.getRoom(roomId)
        if (room) {
          socket.to(roomId).emit('player_left', socket.id)
          io.to(roomId).emit('room_updated', room.toJSON())
        }
      }
    })
  })
}
