import crypto from 'crypto'
import { Game } from './game'
import { GameStatus } from '../types/status'

interface GameMap {
  [gameId: string]: Game
}

export class GameManager {
  private static gameMap: GameMap = {}

  static create(challengerId: string, defenderId: string, session: any): Game {
    const gameId = this.generateGameId()
    const game = new Game(gameId, challengerId, defenderId, session)
    this.gameMap[gameId] = game
    return game
  }

  static clear(gameId: string): void {
    delete this.gameMap[gameId]
  }

  static getUserStatus(userId: string): GameStatus {
    const game = Object.values(this.gameMap).find(game => 
      game.challengerId === userId || game.defenderId === userId
    )
    if (!game) {
      return GameStatus.Idle
    }
    return game.isStarted ? GameStatus.Started : GameStatus.Requesting
  }

  private static generateGameId(): string {
    return crypto.randomBytes(16).toString('hex')
  }
}