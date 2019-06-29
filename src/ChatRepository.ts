import { ag } from 'airgram'
import { UPDATE } from 'airgram-api'
import ChatModel from './ChatModel'

export default class ChatRepository<ContextT> {
  private chatMap: Map<number, ChatModel>

  constructor (private airgram: ag.Airgram) {
    this.chatMap = new Map<number, ChatModel>()

    // Add new chats to the store
    airgram.updates.on(UPDATE.updateNewChat, ({ update }, next) => {
      console.info('SET CHAT', update.chat.isSupergroup)
      this.set(update.chat.id, update.chat)
      return next()
    })
  }

  public get (id: number): ChatModel | null {
    if (!id) {
      throw new Error('Chat id is empty')
    }
    if (!this.chatMap.has(id)) {
      setImmediate(() => this.fetch(id))
      return null
    }
    return this.chatMap.get(id)!
  }

  public async isMe (id: number): Promise<boolean> {
    const chat = this.get(id)
    if (chat && 'userId' in chat.type) {
      return (await this.airgram.api.getMe()).id === chat.type.userId
    }
    return false
  }

  public set (id: number, chat: ChatModel): void {
    this.chatMap.set(id, chat)
  }

  private fetch (id: number): Promise<ChatModel> {
    return this.airgram.api.getChat({ chatId: id }).then((chat) => {
      this.chatMap.set(id, chat)
      return chat
    })
  }
}
