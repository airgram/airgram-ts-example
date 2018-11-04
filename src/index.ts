import 'reflect-metadata'
// tslint:disable-next-line:ordered-imports
import { ag, Airgram, AuthDialog, TYPES } from 'airgram'
import DebugLogger from 'airgram-debug'
import { getCalleeName, prompt } from 'airgram/helpers'
import { interfaces } from 'inversify'
import PouchDBStore from './PouchDBStore'

const airgram = new Airgram({ id: Number(process.env.APP_ID!), hash: process.env.APP_HASH! })

airgram.bind<ag.Logger & { level: string }>(TYPES.Logger).to(DebugLogger)
  .onActivation((context: interfaces.Context, logger) => {
    logger.namespace = [getCalleeName(context)]
    logger.level = 'verbose'
    return logger
  })

airgram.bind<PouchDBStore<ag.AuthDoc>>(TYPES.AuthStore).to(PouchDBStore)
airgram.bind<PouchDBStore<ag.MtpState>>(TYPES.MtpStateStore).to(PouchDBStore)

const { auth, updates } = airgram
airgram.use(auth)
airgram.use(updates)

auth.use(new AuthDialog({
  code: () => prompt(`Please enter the secret code:\n`),
  continue: () => false,
  phoneNumber: () => process.env.PHONE_NUMBER || prompt(`Please enter your phone number:\n`),
  samePhoneNumber: ({ phoneNumber }) => prompt(`Do you want to sign in with the "${phoneNumber}" phone number? Y/n\n`)
    .then((answer) => !['N', 'n'].includes(answer.charAt(0)))
}))

// Getting updates
updates.use(({ update }: ag.UpdateContext, next) => {
  console.log(`"${update._}" ${JSON.stringify(update)}`)
  return next()
})

updates.startPolling().then(() => {
  console.info('Long polling started')
}).catch((error) => {
  console.error(error)
})

airgram.use((ctx: ag.Context, next) => {
  console.log(`Event: ${ctx._}`)
  return next()
})

// Get dialogs list
airgram.client.messages.getDialogs({
  flags: 0,
  limit: 30,
  offset_date: 0,
  offset_id: 0,
  offset_peer: { _: 'inputPeerEmpty' }
}).then((dialogs) => {
  console.info(dialogs)
}).catch((error) => {
  console.error(error)
})
