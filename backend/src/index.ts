import { type ENVS } from './environment'
import { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'

import { getAllAlbums } from './features/album/getAllAlbums'
import { getAlbum } from './features/album/getAlbum'

const app = new OpenAPIHono<{ Bindings: ENVS }>()

// 라우트 등록
app.route('/', getAllAlbums)
app.route('/', getAlbum)

// Swagger UI
app.get('/ui', swaggerUI({ url: '/doc' }))
app.doc('/doc', {
  openapi: '3.0.0',
  info: { version: '1.0.0', title: 'Photo Sharing API' },
})

export default app
