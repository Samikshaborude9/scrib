/**
 * Lobby-related data models and types
 */

export interface LobbyRoomData {
  id: string
  code: string
  name: string
  hostId: string
  hostName: string
  currentPlayers: number
  maxPlayers: number
  status: 'waiting' | 'in-progress' | 'finished'
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
  lastActivityAt: Date
}

export interface LobbyStats {
  totalRooms: number
  publicRooms: number
  waitingRooms: number
  activeRooms: number
  finishedRooms: number
  totalPlayers: number
  totalOnline: number
}

export interface RoomValidationResponse {
  code: string
  name: string
  host: string
  currentPlayers: number
  maxPlayers: number
  joinable: boolean
  reason?: string
}

export interface LobbyResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface RoomListResponse extends LobbyResponse<LobbyRoomData[]> {
  count?: number
}

/**
 * Lobby service for managing lobby operations
 * Can be extended to include database persistence
 */
export class LobbyService {
  /**
   * Check if a room code is valid format
   */
  static isValidCode(code: string): boolean {
    // 6 character alphanumeric
    return /^[A-Z0-9]{6}$/.test(code.toUpperCase())
  }

  /**
   * Format room data for lobby display
   */
  static formatRoomForLobby(room: any): LobbyRoomData {
    return {
      id: room.id,
      code: room.code,
      name: room.name,
      hostId: room.hostId,
      hostName: room.hostName || 'Unknown',
      currentPlayers: room.players?.length || 0,
      maxPlayers: room.maxPlayers,
      status: this.getStatus(room.state),
      isPublic: room.isPublic,
      createdAt: room.createdAt || new Date(),
      updatedAt: room.updatedAt || new Date(),
      lastActivityAt: room.lastActivityAt || new Date(),
    }
  }

  /**
   * Convert room state to status
   */
  private static getStatus(state: string): 'waiting' | 'in-progress' | 'finished' {
    switch (state) {
      case 'waiting':
        return 'waiting'
      case 'game_over':
        return 'finished'
      default:
        return 'in-progress'
    }
  }

  /**
   * Check if room can be joined
   */
  static canJoinRoom(room: any): { canJoin: boolean; reason?: string } {
    if (room.isFull()) {
      return { canJoin: false, reason: 'Room is full' }
    }
    if (room.state !== 'waiting') {
      return { canJoin: false, reason: 'Game already in progress' }
    }
    return { canJoin: true }
  }

  /**
   * Calculate lobby statistics
   */
  static calculateStats(rooms: any[], onlineCount: number): LobbyStats {
    const publicRooms = rooms.filter(r => r.isPublic)
    const waitingRooms = publicRooms.filter(r => r.state === 'waiting')
    const activeRooms = publicRooms.filter(r => r.state !== 'waiting' && r.state !== 'game_over')
    const finishedRooms = publicRooms.filter(r => r.state === 'game_over')
    const totalPlayers = rooms.reduce((sum, r) => sum + (r.players?.length || 0), 0)

    return {
      totalRooms: rooms.length,
      publicRooms: publicRooms.length,
      waitingRooms: waitingRooms.length,
      activeRooms: activeRooms.length,
      finishedRooms: finishedRooms.length,
      totalPlayers: totalPlayers,
      totalOnline: onlineCount,
    }
  }
}
