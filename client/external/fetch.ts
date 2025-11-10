import createClient from 'openapi-fetch'
import type { paths } from './schema'

// const serverURL = 'http://localhost:8787'
const serverURL = 'https://backend.krabat116-ac1.workers.dev'
// const serverURL = 'http://10.0.2.2:8787'

export const api = createClient<paths>({ baseUrl: serverURL })
