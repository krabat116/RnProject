import { z, createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { getDB } from '../../external/database/db'
import { type ENVS } from '../../environment'

/**
 * This defines the structure of our routes input or body of the request
 */
const getCommentsParams = z
  .object({
    albumId: z
      .string()
      .min(1)
      .openapi({
        param: {
          in: 'path',
          name: 'albumId',
        },
        example: 'album1',
      }),
  })
  .openapi('CommentsFetch')

/**
 * Defines the return type the UI should recieve./
 */
const CommentsResponse = z.object({
  type: z.string(),
  comments: z.array(
    z.object({
      content: z.string(),
      albumid: z.string(),
      // dateAdded: z.string(),
      dateCreated: z.string(),
      id: z.string(),
      owner: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      profileImage: z.string().nullable(),
    })
  ),
})

/**
 * This both defines our routes setup, but also generates the openAPI documentation.
 */
const getCommentsRoute = createRoute({
  method: 'get',
  path: '/comment/{albumId}',
  request: {
    params: getCommentsParams,
  },
  responses: {
    201: {
      description: 'add a new comment to an album.',
      content: {
        'application/json': {
          schema: CommentsResponse,
        },
      },
    },
  },
})

export const getComments = new OpenAPIHono<{ Bindings: ENVS }>()

/**
 * This is the actual logic part of our route / feature.
 */
getComments.openapi(getCommentsRoute, async (c) => {
  const db = getDB(c.env.DB)
  const albumId = c.req.param('albumId')

  const comments = await db
    .selectFrom('AlbumComments')
    .selectAll('AlbumComments')
    .innerJoin('Users', 'AlbumComments.owner', 'Users.id')
    .select('Users.firstName as firstName')
    .select('Users.lastName as lastName')
    .select('Users.profileImage as profileImage')
    .where('albumid', '=', albumId)
    .orderBy('AlbumComments.dateCreated', 'desc')
    .execute()

  return c.json(
    {
      type: 'SUCCESS',
      comments,
    },
    201
  )
})
