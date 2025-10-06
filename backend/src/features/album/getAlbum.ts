import { z, createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { getObjectStorage } from '../../external/objectstorage/types'
import { ENVS } from '../../environment'
import { getDB } from '../../external/database/db'

const getAlbumParams = z.object({
  albumId: z
    .string()
    .min(1)
    .openapi({
      param: {
        in: 'path',
        name: 'albumId',
      },
      description: 'Id of album you wish to fetch.',
    }),
})

const AlbumType = z.object({
  description: z.string(),
  name: z.string(),
  dateCreated: z.string(),
  id: z.string(),
  lastUpdated: z.string(),
  numImages: z.number().nullish(),
  owner: z.string(),
  thumbnailUrl: z.string(),
})

const SuccessResponse = z.object({
  type: z.string(),
  message: z.string(),
  album: AlbumType,
})

const ErrorResponse = z.object({
  type: z.string(),
  message: z.string(),
})

/**
 * This both defines our routes setup, but also generates the openAPI documentation.
 */
const getAlbumRoute = createRoute({
  method: 'get',
  path: '/album/{albumId}',
  request: {
    params: getAlbumParams,
  },
  responses: {
    200: {
      description: 'Fetch an album object.',
      content: {
        'application/json': {
          schema: SuccessResponse,
        },
      },
    },
    404: {
      description: 'album could not be found.',
      content: {
        'application/json': {
          schema: ErrorResponse,
        },
      },
    },
  },
})

export const getAlbum = new OpenAPIHono<{ Bindings: ENVS }>()

/**
 * This is the actual logic part of our route / feature.
 */
getAlbum.openapi(getAlbumRoute, async (c) => {
  const db = getDB(c.env.DB)
  const albumId = c.req.param('albumId')

  try {
    const album = await db
      .selectFrom('Albums')
      .selectAll()
      .where('id', '=', albumId)
      .executeTakeFirst()

    if (!album) throw new Error(`Unable to find album with id:${albumId}`)

    return c.json(
      {
        type: 'SUCCESS',
        message: 'Successfully found album.',
        album,
      },
      200
    )
  } catch (e) {
    console.error(e)
    return c.json(
      {
        type: 'ERROR',
        message: 'Failed to find album.',
      },
      404
    )
  }
})
