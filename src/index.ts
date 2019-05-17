import 'reflect-metadata'
// tslint:disable-next-line:ordered-imports
import { ag, Airgram, AuthDialog, TYPES } from 'airgram'
import DebugLogger from 'airgram-debug'
import MtpNetwork from 'airgram/base/MtpNetwork'
import { getCalleeName, prompt } from 'airgram/helpers'
import axios from 'axios'
import * as https from 'https'
import { interfaces } from 'inversify'
import PouchDBStore from './PouchDBStore'

const airgram = new Airgram({ id: Number(process.env.APP_ID!), hash: process.env.APP_HASH! })

airgram.bind<ag.Logger & { level: string }>(TYPES.Logger).to(DebugLogger)
  .onActivation((context: interfaces.Context, logger) => {
    logger.namespace = [getCalleeName(context)]
    logger.level = 'verbose'
    return logger
  })

airgram.bind<MtpNetwork>(TYPES.MtpNetwork).to(MtpNetwork).onActivation((context, network) => {
  const httpsAgent = new https.Agent()
  network.axios = axios.create({ httpsAgent })
  return network
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

auth.login().then(async () => {
  // Start long polling
  await updates.startPolling()

  // Get dialogs list
  const dialogs = await airgram.client.messages.getDialogs({
    flags: 0,
    limit: 30,
    offset_date: 0,
    offset_id: 0,
    offset_peer: { _: 'inputPeerEmpty' }
  })

  console.log(dialogs)

}).catch((error) => {
  console.error(error)
})

// Getting updates
updates.use(({ update }: ag.UpdateContext & { update: Record<string, any> }, next) => {
  console.log(`"${update._}" ${JSON.stringify(update)}`)
  return next()
})
