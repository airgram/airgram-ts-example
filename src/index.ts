import { UPDATE } from '@airgram/api'
import { useModels } from '@airgram/use-models'
import { Airgram, Auth, prompt } from 'airgram'
import ChatModel from './ChatModel'
import { Context, contextFactory } from './context'

const airgram = new Airgram<Context>({
  apiHash: process.env.APP_HASH!,
  apiId: Number(process.env.APP_ID!),
  command: process.env.TDLIB_COMMAND,
  contextFactory,
  logVerbosityLevel: 2,
  models: useModels({
    chat: ChatModel
  })
})

const auth = new Auth(airgram)

auth.use({
  code: () => prompt(`Please enter the secret code:\n`),
  phoneNumber: async () => process.env.PHONE_NUMBER || prompt(`Please enter your phone number:\n`)
})

// Get current user
airgram.api.getMe().then((me) => {
  console.log(`[Me] `, JSON.stringify(me))
}).catch((error) => {
  console.error(error)
})

// Getting all updates
airgram.updates.use((ctx, next) => {
  console.log(`[all updates][${ctx._}]`, JSON.stringify(ctx.update))
  return next()
})

airgram.updates.on(UPDATE.updateNewMessage, async ({ chats, update }) => {
  const { message } = update
  const chat = chats.get(message.chatId)

  if (!chat) {
    throw new Error('Unknown chat')
  }

  console.log('[new message]', {
    title: chat.title,
    isBasicGroup: chat.isBasicGroup,
    isSupergroup: chat.isSupergroup,
    isPrivateChat: chat.isPrivateChat,
    isSecretChat: chat.isSecretChat,
    isMeChat: await chats.isMe(chat.id),
    message: JSON.stringify(message)
  })
})
