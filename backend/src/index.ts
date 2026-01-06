import { type ENVS } from './environment'
import { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'
import { createAlbum } from './features/album/createAlbum'
import { getAllAlbums } from './features/album/getAllAlbums'
import { getAlbum } from './features/album/getAlbum'
import { deleteAlbum } from './features/album/deleteAlbum'

import { getImage } from './features/image/getImage'
import { getAllImages } from './features/image/getAllImages'
import { uploadImage } from './features/image/uploadImage'
import { updateImage } from './features/image/updateImage'
import { deleteImage } from './features/image/deleteImage'

import { createGroup } from './features/group/createGroup'
import { getGroup } from './features/group/getGroup'
import { updateGroup } from './features/group/updateGroup'
import { deleteGroup } from './features/group/deleteGroup'
import { getUserGroups } from './features/group/getUserGroups'
import { getGroupAlbums } from './features/group/getGroupsAlbums'
import { createGroupAlbum } from './features/group/addAlbumToGroup'
import { removeGroupAlbum } from './features/group/removeAlbumFromGroup'

const app = new OpenAPIHono<{ Bindings: ENVS }>()

// 라우트 등록
app.route('/', getAllAlbums)
app.route('/', getAlbum)
app.route('/', createAlbum)
app.route('/', deleteAlbum)

app.route('/', getImage)
app.route('/', getAllImages)
app.route('/', uploadImage)
app.route('/', updateImage)
app.route('/', deleteImage)

app.route('', createGroup)
app.route('', getGroup)
app.route('', updateGroup)
app.route('', deleteGroup)
app.route('', getUserGroups)
app.route('', getGroupAlbums)
app.route('', createGroupAlbum)
app.route('', removeGroupAlbum)

// Swagger UI
app.get('/ui', swaggerUI({ url: '/doc' }))
app.doc('/doc', {
  openapi: '3.0.0',
  info: { version: '1.0.0', title: 'Photo Sharing API' },
})

export default app
