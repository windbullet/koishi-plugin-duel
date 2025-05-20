import { Schema } from 'koishi'

export interface Config {
  timeout: number
  minTime: number
  maxTime: number
}

export const Config: Schema<Config> = Schema.object({
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
})