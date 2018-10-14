import { ag } from 'airgram'
import { injectable } from 'inversify'
import { createCollection, PouchDB } from './pouchdb'

const db: PouchDB.Database = createCollection('airgram')

@injectable()
export default class PouchDBStore<DocT> implements ag.Store<DocT> {
  public create (id: string, doc: DocT): Promise<DocT> {
    return db.upsert(id, () => doc).then(() => doc)
  }

  public async get (key: string): Promise<DocT | null> {
    try {
      return await db.get<DocT>(key)
    } catch (e) {
      return null
    }
  }

  public async update (id: string, doc: Partial<DocT>): Promise<Partial<DocT>> {
    let nextDoc
    return db.upsert(id, (currentDoc: DocT) => {
      nextDoc = Object.assign({}, currentDoc, doc)
      return nextDoc
    }).then(() => nextDoc)
  }
}
