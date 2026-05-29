import { RoomManager } from '../rooms/RoomManager'
import { LobbyRoom } from '@scribble/types'
import { LobbyService, LobbyStats } from '../models/lobby'

export class LobbyController {
  constructor(private roomManager: RoomManager) {}

  /**
   * Get all public rooms that are waiting or in-progress
   */
  getPublicRooms(): LobbyRoom[] {
    return this.roomManager
      .getAllRooms()
      .filter(room => room.isPublic)
      .map(room => this.roomToLobbyRoom(room))
  }

  /**
   * Get online player count (connected sockets in lobby)
   */
  getOnlineCount(io: any): number {
    return io.engine.clientsCount
  }

  /**
   * Get lobby statistics
   */
  getStats(io: any): LobbyStats {
    const rooms = this.roomManager.getAllRooms()
    const onlineCount = io.engine.clientsCount
    return LobbyService.calculateStats(rooms, onlineCount)
  }

  /**
   * Validate if a room can be joined
   */
  validateRoomForJoin(code: string): { valid: boolean; reason?: string; room?: LobbyRoom } {
    if (!LobbyService.isValidCode(code)) {
      return { valid: false, reason: 'Invalid room code format' }
    }

    const room = this.roomManager.getRoomByCode(code.toUpperCase())
    if (!room) {
      return { valid: false, reason: 'Room not found' }
    }

    const { canJoin, reason } = LobbyService.canJoinRoom(room)
    if (!canJoin) {
      return { valid: false, reason }
    }

    return {
      valid: true,
      room: this.roomToLobbyRoom(room),
    }
  }

  /**
   * Convert Room to LobbyRoom for display
   */
  private roomToLobbyRoom(room: any): LobbyRoom {
    return {
      id: room.id,
      code: room.code,
      name: room.name,
      host: room.hostName || 'Unknown',
      currentPlayers: room.players.length,
      maxPlayers: room.maxPlayers,
      status: room.state === 'waiting' ? 'waiting' : room.state === 'game_over' ? 'finished' : 'in-progress',
      isPublic: room.isPublic,
    }
  }
}
