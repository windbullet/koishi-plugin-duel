import { Context, Session, h } from 'koishi'
import { Config, GameConfig } from '../types/config'
import { GameManager } from '../game/manager'
import { GameStatus } from '../types/status'

export function registerDuelCommand(ctx: Context, config: Config) {
  ctx.command("duel <user:user>")
    .alias('发起决斗')
    .action(async ({ session }, user) => {
      const challengerId = session.userId
      const defenderId = user.split(":")[1]

      if (challengerId === defenderId) {
        return '哪有自己和自己决斗的，要不裁判也你来当？'
      }

      switch (GameManager.getUserStatus(defenderId)) {
        case GameStatus.Idle: break
        case GameStatus.Requesting: return '对方正在发起或被发起决斗邀请，等等吧'
        case GameStatus.Started: return '对方正在和别人决斗，要不捣乱捣乱？'
      }

      const gameConfig: GameConfig = {
        challengerId,
        defenderId,
        session,
        config: config
      }

      const game = GameManager.create(gameConfig)

      const accepted = await requestDuel(gameConfig)

      if (!accepted) {
        GameManager.clear(game.gameId)
        return `${h.at(challengerId)} 对方拒绝了你的决斗请求......`
      }

      game.start()
    })
}

async function requestDuel(gameConfig: GameConfig): Promise<boolean> {
  const {session, config, defenderId} = gameConfig

  await session.send(`${h.at(defenderId)} ${session.username}向你发起了决斗，${config.timeout}秒内发送“接受”或“拒绝”`)

  return new Promise<boolean>((resolve) => {
    const dispose = session.app
      .guild(session.guildId)
      .user(defenderId)
      .middleware(async (session, next) => {
        if (session.content === "接受") {
          resolve(true)
        } else if (session.content === "拒绝") {
          resolve(false)
        } else {
          return next()
        }
      }, true)

    session.app.setTimeout(() => {
      dispose()
      resolve(false)
    }, config.timeout * 1000)
  })
}

