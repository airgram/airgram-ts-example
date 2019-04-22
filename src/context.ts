import { ag, createContext } from 'airgram'
import ChatRepository from './ChatRepository'

export interface Context extends ag.Context {
  chats: ChatRepository<Context>
}

export const contextFactory: ag.ContextFactory<Context> = (airgram: ag.Airgram<Context>) => {
  const chats = new ChatRepository<Context>(airgram)

  return (options: ag.ContextOptions) => ({
    ...createContext(options),
    chats
  })
}
