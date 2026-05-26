import { Room } from './Room'
import { Server } from 'socket.io'
import { Player } from '@scribble/types'

export class RoomManager {
  private rooms: Map<string, Room> = new Map()
  private io: Server

  constructor(io: Server) {
    this.io = io
  }

  createRoom(name: string, hostId: string, maxPlayers: number, maxRounds: number): Room {
    const room = new Room(name, hostId, maxPlayers, maxRounds, {
      onTick: (timeLeft) => {
        this.io.to(room.id).emit('timer_tick', timeLeft)
      },
      onRoundStart: (drawerId, word, hint, timeLeft) => {
        // Send word only to drawer, hint to others
        room.players.forEach(p => {
          const payload = {
            round: room.round,
            drawerId,
            wordHint: hint,
            timeLeft,
            ...(p.id === drawerId ? { word } : {}),
          }
          this.io.to(p.id).emit('round_start', payload)
        })
        this.io.to(room.id).emit('room_updated', room.toJSON())
      },
      onRoundEnd: (word, scores) => {
        this.io.to(room.id).emit('round_end', { word, scores })
      },
      onGameOver: (scores, winner) => {
        this.io.to(room.id).emit('game_over', { scores, winner })
      },
    })
    this.rooms.set(room.id, room)
    return room
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId)
  }

  getOpenRooms(): Room[] {
    return [...this.rooms.values()].filter(
      r => r.state === 'waiting' && !r.isFull()
    )
  }

  removeRoom(roomId: string) {
    const room = this.rooms.get(roomId)
    if (room) {
      room.stopTimer()
      this.rooms.delete(roomId)
    }
  }

  addPlayerToRoom(
    roomId: string,
    player: Player
  ): Room | null {
    const room = this.rooms.get(roomId)
    if (!room || room.isFull()) return null
    room.addPlayer(player)
    return room
  }

  removePlayerFromRoom(socketId: string): string | null {
    for (const [roomId, room] of this.rooms) {
      const player = room.getPlayer(socketId)
      if (player) {
        room.removePlayer(socketId)
        if (room.players.length === 0) {
          this.removeRoom(roomId)
          return null
        }
        // Transfer host if needed
        if (room.hostId === socketId) {
          room.hostId = room.players[0].id
        }
        return roomId
      }
    }
    return null
  }

  getRoomBySocketId(socketId: string): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.getPlayer(socketId)) return room
    }
  }
}
