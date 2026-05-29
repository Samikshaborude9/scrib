import { Router, Request, Response } from 'express'
import { LobbyController } from '../controllers/lobbycontroller'
import { RoomManager } from '../rooms/RoomManager'

export function createLobbyRoutes(roomManager: RoomManager): Router {
  const router = Router()
  const lobbyController = new LobbyController(roomManager)

  /**
   * GET /api/lobby/rooms
   * Get all public rooms
   */
  router.get('/rooms', (req: Request, res: Response) => {
    try {
      const rooms = lobbyController.getPublicRooms()
      res.json({
        success: true,
        data: rooms,
        count: rooms.length,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch rooms',
      })
    }
  })

  /**
   * GET /api/lobby/room/:code
   * Get room details by code
   */
  router.get('/room/:code', (req: Request, res: Response) => {
    try {
      const { code } = req.params
      const room = roomManager.getRoomByCode(code.toUpperCase())

      if (!room) {
        return res.status(404).json({
          success: false,
          error: 'Room not found',
        })
      }

      res.json({
        success: true,
        data: {
          id: room.id,
          code: room.code,
          name: room.name,
          host: room.hostName,
          currentPlayers: room.players.length,
          maxPlayers: room.maxPlayers,
          status: room.state === 'waiting' ? 'waiting' : room.state === 'game_over' ? 'finished' : 'in-progress',
          isPublic: room.isPublic,
          players: room.players.map(p => ({
            id: p.id,
            username: p.username,
            score: p.score,
            isDrawing: p.isDrawing,
          })),
        },
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch room',
      })
    }
  })

  /**
   * GET /api/lobby/stats
   * Get lobby statistics
   */
  router.get('/stats', (req: Request, res: Response) => {
    try {
      const allRooms = roomManager.getAllRooms()
      const publicRooms = allRooms.filter(r => r.isPublic)
      const waitingRooms = publicRooms.filter(r => r.state === 'waiting')
      const activeRooms = publicRooms.filter(r => r.state !== 'waiting' && r.state !== 'game_over')

      const totalPlayers = allRooms.reduce((sum, r) => sum + r.players.length, 0)

      res.json({
        success: true,
        data: {
          totalRooms: allRooms.length,
          publicRooms: publicRooms.length,
          waitingRooms: waitingRooms.length,
          activeRooms: activeRooms.length,
          totalPlayers: totalPlayers,
        },
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch stats',
      })
    }
  })

  /**
   * POST /api/lobby/room/validate/:code
   * Validate if a room code exists and is joinable
   */
  router.post('/room/validate/:code', (req: Request, res: Response) => {
    try {
      const { code } = req.params
      const room = roomManager.getRoomByCode(code.toUpperCase())

      if (!room) {
        return res.status(404).json({
          success: false,
          error: 'Room not found',
          joinable: false,
        })
      }

      const joinable = !room.isFull() && room.state === 'waiting'

      res.json({
        success: true,
        data: {
          code: room.code,
          name: room.name,
          host: room.hostName,
          currentPlayers: room.players.length,
          maxPlayers: room.maxPlayers,
          joinable: joinable,
          reason: !joinable 
            ? room.isFull() 
              ? 'Room is full' 
              : 'Game already in progress'
            : null,
        },
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Validation failed',
        joinable: false,
      })
    }
  })

  return router
}
