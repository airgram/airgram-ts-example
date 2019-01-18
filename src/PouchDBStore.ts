import { ag } from 'airgram'
import { injectable } from 'inversify'
import { createCollection, PouchDB } from './pouchdb'

const db: PouchDB.Database = createCollection('airgram')

@injectable()
export default class PouchDBStore<DocT> implements ag.Store<DocT> {
  public async delete (id: string): Promise<void> {
    db.get(id).then((doc) => db.remove(doc)).catch((error) => {
      if (error.status === 404) {
        return null
      }
      throw error
    })
  }

  public async get (key: string, field?: string): Promise<any> {
    try {
      const value = await db.get<DocT>(key)
      return field ? value[field] : value
    } catch (e) {
      return null
    }
  }

  public async set (id: string, doc: Partial<DocT>): Promise<Partial<DocT>> {
    let nextDoc
    return db.upsert(id, (currentDoc: DocT) => {
      nextDoc = Object.assign({}, currentDoc, doc)
      return nextDoc
    }).then(() => nextDoc)
  }
}
