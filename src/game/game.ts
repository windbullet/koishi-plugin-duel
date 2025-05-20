import { Context, Session, h, Random } from 'koishi'
import { Config } from '../types/config'
import { GameManager } from './manager'

export class Game {
  isStarted: boolean
  readonly gameId: string
  readonly challengerId: string
  readonly defenderId: string
  private readonly session: Session<never, never, Context>
  private dispose: (() => void)[]

  constructor(gameId: string, challengerId: string, defenderId: string, session: Session) {
    this.gameId = gameId
    this.challengerId = challengerId
    this.defenderId = defenderId
    this.session = session
    this.isStarted = false
    this.dispose = []
  }

  start(ctx: Context, config: Config) {
    this.isStarted = true
    this.session.send("决斗规则：\n机器人会在随机时间发送“开始”，谁最先在开始之后发送“开枪”谁就获得决斗的胜利！\n在其他时候发送任何消息，或者在开始之后发送其他消息都会直接判负哦~")
    this.setupPrematureListeners(ctx)
    this.setupStartTimer(ctx, config)
  }

  private setupPrematureListeners(ctx: Context) {
    const prematureListenerDispose = ctx.guild(this.session.guildId)
      .user(this.challengerId, this.defenderId)
      .on("message", (user) => {
        if (user.stripped.content !== "开始") {
          this.gameover(`${h.at(user.userId)} 输掉了决斗！`)
        }
      })
    this.dispose.push(prematureListenerDispose)
  }

  private setupStartTimer(ctx: Context, config: Config) {
    const time = Random.int(config.minTime, config.maxTime)
    const startTimerDispose = ctx.setTimeout(() => {
      this.disposeAllListener()
      this.startShootingPhase(ctx)
    }, time)
    this.dispose.push(startTimerDispose)
  }

  private startShootingPhase(ctx: Context) {
    const shootingListenerDispose = ctx.guild(this.session.guildId)
      .user(this.challengerId, this.defenderId)
      .on("message", (user) => {
        if (user.stripped.content !== "开枪") {
          this.gameover(`${h.at(user.userId)} 输掉了决斗！`)
        } else {
          this.gameover(`${h.at(user.userId)} 获得决斗胜利！`)
        }
      })
    this.dispose.push(shootingListenerDispose)
    this.session.send(`${h.at(this.challengerId)} ${h.at(this.defenderId)} 开始`)
  }

  private gameover(message: string) {
    this.disposeAllListener()
    this.session.send(message)
    GameManager.clear(this.gameId)
  }

  private disposeAllListener() {
    this.dispose.forEach((dispose) => dispose())
    this.dispose = []
  }
}