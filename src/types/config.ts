import { Schema, Session } from 'koishi'

export interface Config {
  timeout: number
  minTime: number
  maxTime: number
  muteLoser: boolean
  minMuteTime?: number
  maxMuteTime?: number
}

export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    timeout: Schema.number()
      .default(90)
      .min(0)
      .description("决斗邀请超时时间（s）"),
    minTime: Schema.number()
      .default(1000)
      .min(0)
      .description('机器人随机发送开始的最小时间（ms）'),
    maxTime: Schema.number()
      .default(10000)
      .description('机器人随机发送开始的最大时间（ms）'),
  }),

  Schema.object({
    muteLoser: Schema.boolean()
      .default(true)
      .description("是否禁言败者随机时间（需要机器人有禁言权限）")
  }),
  Schema.union([
    Schema.object({
      muteLoser: Schema.const(true),
      minMuteTime: Schema.number()
        .min(0)
        .required()
        .description("败者最小禁言时间（s）"),
      maxMuteTime: Schema.number()
        .min(0)
        .required()
        .description("败者最大禁言时间（s）")
    }),
    Schema.object({
      muteLoser: Schema.const(false).required(),
    })
  ])
])

export interface GameConfig {
  challengerId: string
  defenderId: string
  session: Session
  config: Config
}