import { createContext } from 'airgram'
import ChatRepository from './ChatRepository'

export interface Context extends Airgram.Context {
  chats: ChatRepository<Context>
}

export const contextFactory: Airgram.ContextFactory<Context> = (airgram: Airgram.AirgramInstance<Context>) => {
  const chats = new ChatRepository<Context>(airgram)

  return (options: Airgram.ContextOptions) => ({
    ...createContext(options),
    chats
  })
}
