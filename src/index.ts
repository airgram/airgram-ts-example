import { UPDATE } from '@airgram/constants'
import { useModels } from '@airgram/use-models'
import { Airgram, Auth, isError, prompt } from 'airgram'
import debug from 'debug'
import ChatModel from './ChatModel'
import { Store } from './Store'

const writeLog = debug('airgram:log')
const writeError = debug('airgram:error')

const store = new Store()

const airgram = new Airgram({
  apiHash: process.env.APP_HASH!,
  apiId: Number(process.env.APP_ID!),
  command: process.env.TDLIB_COMMAND,
  logVerbosityLevel: 2,
  models: useModels({
    chat: ChatModel
  }),
  context: { $store: store }
})

airgram.use(new Auth({
  code: () => prompt(`Please enter the secret code:\n`),
  phoneNumber: async () => process.env.PHONE_NUMBER || prompt(`Please enter your phone number:\n`)
}))

// Get current user
airgram.api.getMe().then((me) => {
  console.log(`[Me] `, JSON.stringify(me))
}).catch((error) => {
  console.error(error)
})

// Save users to the store
airgram.on(UPDATE.updateUser, async ({ $store, update }, next) => {
  const { user } = update
  $store.users.set(user.id, user)
  return next()
})

// Save chats to the store
airgram.on(UPDATE.updateNewChat, async ({ $store, update }, next) => {
  const { chat } = update
  $store.chats.set(chat.id, chat)
  return next()
})

// Save last messages to the store
airgram.on(UPDATE.updateChatLastMessage, async ({ $store, update }, next) => {
  $store.chatLastMessage.set(update.chatId, update)
  return next()
})

airgram.api.getChats({
  limit: 10,
  offsetChatId: 0,
  offsetOrder: '9223372036854775807' // 2^63
}).then(({ response, $store }) => {
  if (isError(response)) {
    throw new Error(`[TDLib][${response.code}] ${response.message}`)
  }
  const chats = response.chatIds.map((chatId) => {
    const chat = $store.chats.get(chatId)
    const message = $store.chatLastMessage.get(chatId)

    if (!chat || !message || !message.lastMessage) {
      throw new Error('Invalidate store')
    }

    const { lastMessage } = message
    const { title } = chat
    const sentBy = $store.users.get(lastMessage.senderUserId)

    return {
      title,
      lastMessage: lastMessage.content,
      sentBy
    }
  })

  writeLog('getChats:')
  writeLog(chats)
}).catch(writeError)

// Getting all updates
// airgram.use((ctx, next) => {
//   if ('update' in ctx) {
//     console.log(`[all updates][${ctx._}]`, JSON.stringify(ctx.update))
//   }
//   return next()
// })

airgram.on(UPDATE.updateNewMessage, async ({ $store, update }) => {
  const { message } = update
  const chat = $store.chats.get(message.chatId)

  if (!chat) {
    throw new Error('Unknown chat')
  }

  console.log('[new message]', {
    title: chat.title,
    isBasicGroup: chat.isBasicGroup,
    isSupergroup: chat.isSupergroup,
    isPrivateChat: chat.isPrivateChat,
    isSecretChat: chat.isSecretChat,
    message: JSON.stringify(message)
  })
})
