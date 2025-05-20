import { Context } from 'koishi';
import { Config } from './types/config';
import { registerDuelCommand } from './commands/duel';

export * from './types/config';
export const name = 'duel';

export function apply(ctx: Context, config: Config) {
  registerDuelCommand(ctx, config);
}