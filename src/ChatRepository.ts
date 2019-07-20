import { UPDATE } from '@airgram/api'
import ChatModel from './ChatModel'

export default class ChatRepository<ContextT> {
  private chatMap: Map<number, ChatModel>

  constructor (private airgram: Airgram.AirgramInstance) {
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
      const me = await this.airgram.api.getMe()
      if (me._ === 'error') {
        throw new Error(me.message)
      }
      return me.id === chat.type.userId
    }
    return false
  }

  public set (id: number, chat: ChatModel): void {
    this.chatMap.set(id, chat)
  }

  private async fetch (id: number): Promise<ChatModel> {
    const chatOrError = await this.airgram.api.getChat({ chatId: id })

    if (chatOrError._ === 'error') {
      throw new Error(chatOrError.message)
    } else {
      this.chatMap.set(id, chatOrError)
    }

    return chatOrError
  }
}
