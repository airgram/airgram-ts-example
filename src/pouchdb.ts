import * as path from 'path'
import * as PouchDB from 'pouchdb'
import * as UpsertPlugin from 'pouchdb-upsert'

PouchDB.plugin(UpsertPlugin)

export { PouchDB }

export function createCollection<DocT> (name: string): PouchDB.Database<DocT> {
  return new PouchDB(path.join(__dirname, `../data/${name}`))
}
