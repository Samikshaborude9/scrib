import { api } from '../lib/api'

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

export interface RoomDetails extends LobbyRoom {
  players: Array<{
    id: string
    username: string
    score: number
    isDrawing: boolean
  }>
}

export interface LobbyStats {
  totalRooms: number
  publicRooms: number
  waitingRooms: number
  activeRooms: number
  totalPlayers: number
}

export interface RoomValidation {
  code: string
  name: string
  host: string
  currentPlayers: number
  maxPlayers: number
  joinable: boolean
  reason?: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  count?: number
}

class LobbyService {
  /**
   * Get all public rooms from the lobby
   */
  async getPublicRooms(): Promise<LobbyRoom[]> {
    try {
      const response = await api.get<ApiResponse<LobbyRoom[]>>('/lobby/rooms')
      if (response.data.success && response.data.data) {
        return response.data.data
      }
      return []
    } catch (error) {
      console.error('Failed to fetch public rooms:', error)
      throw error
    }
  }

  /**
   * Get room details by code
   */
  async getRoomByCode(code: string): Promise<RoomDetails | null> {
    try {
      const response = await api.get<ApiResponse<RoomDetails>>(
        `/lobby/room/${code.toUpperCase()}`
      )
      if (response.data.success && response.data.data) {
        return response.data.data
      }
      return null
    } catch (error) {
      console.error(`Failed to fetch room ${code}:`, error)
      return null
    }
  }

  /**
   * Get lobby statistics
   */
  async getLobbyStats(): Promise<LobbyStats | null> {
    try {
      const response = await api.get<ApiResponse<LobbyStats>>('/lobby/stats')
      if (response.data.success && response.data.data) {
        return response.data.data
      }
      return null
    } catch (error) {
      console.error('Failed to fetch lobby stats:', error)
      return null
    }
  }

  /**
   * Validate if a room code exists and is joinable
   */
  async validateRoomCode(code: string): Promise<RoomValidation | null> {
    try {
      const response = await api.post<ApiResponse<RoomValidation>>(
        `/lobby/room/validate/${code.toUpperCase()}`
      )
      if (response.data.success && response.data.data) {
        return response.data.data
      }
      return null
    } catch (error) {
      console.error(`Failed to validate room code ${code}:`, error)
      return null
    }
  }

  /**
   * Create a new room
   */
  async createRoom(
    name: string,
    maxPlayers: number,
    isPublic: boolean
  ): Promise<LobbyRoom | null> {
    try {
      const response = await api.post<ApiResponse<LobbyRoom>>('/lobby/room', {
        name,
        maxPlayers,
        isPublic,
      })
      if (response.data.success && response.data.data) {
        return response.data.data
      }
      return null
    } catch (error) {
      console.error('Failed to create room:', error)
      throw error
    }
  }

  /**
   * Search rooms by name (optional feature)
   */
  async searchRooms(query: string): Promise<LobbyRoom[]> {
    try {
      const rooms = await this.getPublicRooms()
      return rooms.filter(
        (room) =>
          room.name.toLowerCase().includes(query.toLowerCase()) ||
          room.host.toLowerCase().includes(query.toLowerCase())
      )
    } catch (error) {
      console.error('Failed to search rooms:', error)
      return []
    }
  }

  /**
   * Filter rooms by status
   */
  filterByStatus(
    rooms: LobbyRoom[],
    status: 'waiting' | 'in-progress' | 'finished'
  ): LobbyRoom[] {
    return rooms.filter((room) => room.status === status)
  }

  /**
   * Filter rooms by joinability
   */
  filterJoinable(rooms: LobbyRoom[]): LobbyRoom[] {
    return rooms.filter(
      (room) =>
        room.status === 'waiting' &&
        room.currentPlayers < room.maxPlayers &&
        room.isPublic
    )
  }
}

// Export singleton instance
export const lobbyService = new LobbyService()
