import { CHAT_TYPE } from 'airgram-api'
import { ChatBaseModel } from 'airgram-api/models/Chat'

export default class ChatModel extends ChatBaseModel {
  get isBasicGroup (): boolean {
    return this.type._ === CHAT_TYPE.chatTypeBasicGroup
  }

  get isSupergroup (): boolean {
    return this.type._ === CHAT_TYPE.chatTypeSupergroup
  }

  get isPrivateChat (): boolean {
    return this.type._ === CHAT_TYPE.chatTypePrivate
  }

  get isSecretChat (): boolean {
    return this.type._ === CHAT_TYPE.chatTypeSecret
  }
}

// tslint:disable:no-empty-interface
declare module 'airgram-api/outputs/Chat' {
  export interface Chat extends ChatModel {}
}
