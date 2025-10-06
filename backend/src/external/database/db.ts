import { DB } from 'kysely-codegen'
import { Kysely } from 'kysely'
import { D1Dialect } from 'kysely-d1'

export const getDB = (DBBinding: D1Database) => {
  const dialect = new D1Dialect({
    database: DBBinding,
  })

  return new Kysely<DB>({
    dialect,
  })
}
