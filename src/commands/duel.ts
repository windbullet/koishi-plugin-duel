import { Context, Session, h } from 'koishi'
import { Config } from '../types/config'
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

      const accepted = await requestDuel(defenderId, config.timeout, session, ctx)

      if (accepted) {
        const game = GameManager.create(challengerId, defenderId, session)
        game.start(ctx, config)
      } else {
        return `${h.at(challengerId)} 对方拒绝了你的决斗请求......`
      }
    })
}

async function requestDuel(
  defenderId: string,
  timeout: number,
  session: Session,
  ctx: Context,
): Promise<boolean> {
  await session.send(`${h.at(defenderId)} ${session.username}向你发起了决斗，${timeout}秒内发送“接受”或“拒绝”`)

  return new Promise<boolean>((resolve) => {
    const dispose = ctx
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

    ctx.setTimeout(() => {
      dispose()
      resolve(false)
    }, timeout * 1000)
  })
}