import { Context, Session, h, Random } from 'koishi'
import { Config, GameConfig } from '../types/config'
import { GameManager } from './manager'

// 定义游戏类
export class Game {
  isStarted: boolean
  readonly gameId: string
  readonly challengerId: string
  readonly defenderId: string
  private readonly session: Session<never, never, Context>
  private readonly ctx: Context
  private readonly config: Config
  private dispose: (() => void)[]

  constructor(gameId: string, gameConfig: GameConfig) {
    this.gameId = gameId
    this.challengerId = gameConfig.challengerId
    this.defenderId = gameConfig.defenderId
    this.session = gameConfig.session
    this.isStarted = false
    this.dispose = []
    this.ctx = this.session.app
    this.config = gameConfig.config
  }

  start() {
    this.isStarted = true
    this.session.send("决斗规则：\n机器人会在随机时间发送“开始”，谁最先在开始之后发送“开枪”谁就获得决斗的胜利！\n在其他时候发送任何消息，或者在开始之后发送其他消息都会直接判负哦~")
    this.setupPrematureListeners()
    this.setupStartTimer()
  }

  private setupPrematureListeners() {
    const prematureListenerDispose = this.ctx.guild(this.session.guildId)
      .user(this.challengerId, this.defenderId)
      .on("message", (user) => {
        const loserId = user.userId
        const winnerId = loserId === this.challengerId ? this.defenderId : this.challengerId
        this.gameover(winnerId, loserId)
      })
    this.dispose.push(prematureListenerDispose)
  }

  private setupStartTimer() {
    const randomTime = Random.int(this.config.minTime, this.config.maxTime + 1)
    const startTimerDispose = this.ctx.setTimeout(() => {
      this.disposeAllListener()
      this.startShootingPhase()
    }, randomTime)
    this.dispose.push(startTimerDispose)
  }

  private startShootingPhase() {
    const shootingListenerDispose = this.ctx.guild(this.session.guildId)
      .user(this.challengerId, this.defenderId)
      .on("message", (user) => {
        let winnerId = user.userId
        let loserId = winnerId === this.challengerId ? this.defenderId : this.challengerId

        if (user.stripped.content !== "开枪") {
          [winnerId, loserId] = [loserId, winnerId]
        }

        this.gameover(winnerId, loserId)
      })
    this.dispose.push(shootingListenerDispose)
    this.session.send(`${h.at(this.challengerId)} ${h.at(this.defenderId)} 开始`)
  }

  private gameover(winnerId: string, loserId: string) {
    this.disposeAllListener()
    if (this.config.muteLoser) this.mute(loserId)
    this.session.send(`${h.at(winnerId)} 获得决斗胜利！`)
    GameManager.clear(this.gameId)
  }

  private disposeAllListener() {
    this.dispose.forEach((dispose) => dispose())
    this.dispose = []
  }

  private mute(loserId: string) {
    const muteTime = Random.int(this.config.minMuteTime, this.config.maxMuteTime + 1)
    this.session.bot.muteGuildMember(this.session.guildId, loserId, muteTime * 1000)
  }
}