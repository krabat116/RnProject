import { z, createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { ENVS } from '../../environment'
import { getDB } from '../../external/database/db'

const getAllAlbumParams = z.object({
  userId: z
    .string()
    .min(1)
    .openapi({
      param: {
        in: 'path',
        name: 'userId',
      },
      description: 'Id of user you wish to fetch albums for.',
    }),
})

const SuccessResponse = z.object({
  type: z.string(),
  message: z.string(),
  albumIds: z.array(z.string()),
})

const ErrorResponse = z.object({
  type: z.string(),
  message: z.string(),
})

/**
 * This both defines our routes setup, but also generates the openAPI documentation.
 */
const getAllAlbumsRoute = createRoute({
  method: 'get',
  path: '/album/all/{userId}',
  request: {
    params: getAllAlbumParams,
  },
  responses: {
    200: {
      description: 'Fetch all albums for a user.',
      content: {
        'application/json': {
          schema: SuccessResponse,
        },
      },
    },
    404: {
      description: 'albums could not be fetched.',
      content: {
        'application/json': {
          schema: ErrorResponse,
        },
      },
    },
  },
})

export const getAllAlbums = new OpenAPIHono<{ Bindings: ENVS }>()

/**
 * This is the actual logic part of our route / feature.
 */
getAllAlbums.openapi(getAllAlbumsRoute, async (c) => {
  const db = getDB(c.env.DB)
  const userId = c.req.param('userId')

  try {
    const albumIds = await db
      .selectFrom('Albums')
      .select('id')
      .where('owner', '=', userId)
      .execute()

    return c.json(
      {
        type: 'SUCCESS',
        message: 'Successfully found albums for user.',
        albumIds: albumIds.map((album) => album.id),
      },
      200
    )
  } catch (e) {
    console.error(e)
    return c.json(
      {
        type: 'ERROR',
        message: 'Failed to get all albums for a user.',
      },
      404
    )
  }
})
