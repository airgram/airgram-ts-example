import { ChatUnion, UpdateChatLastMessage, UserUnion } from 'airgram'

export class Store {
  public readonly chats: Map<number, ChatUnion> = new Map()

  public readonly chatLastMessage: Map<number, UpdateChatLastMessage> = new Map()

  public readonly users: Map<number, UserUnion> = new Map()
}

declare module '@airgram/core/types/airgram' {
  interface ApiResponse<ParamsT, ResultT> {
    $store: Store
  }

  interface UpdateContext<UpdateT> {
    $store: Store
  }
}
