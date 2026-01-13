import { z, createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { getDB } from '../../external/database/db'
import { type ENVS } from '../../environment'
import { getNewId } from '../../external/ids/getId'

/**
 * This defines the structure of our routes input or body of the request
 */
const createCommentSchema = z
  .object({
    ownerId: z.string().min(1).openapi({ example: 'user1' }),
    albumId: z.string().min(1).openapi({ example: 'album1' }),
    content: z
      .string()
      .min(1)
      .openapi({ example: 'Wow! such a beautiful pic!' }),
  })
  .openapi('CommentCreate')

/**
 * Defines the return type the UI should recieve.
 */
const Response = z.object({
  type: z.string(),
  message: z.string(),
})

/**
 * This both defines our routes setup, but also generates the openAPI documentation.
 */
const createCommentRoute = createRoute({
  method: 'post',
  path: '/comment',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createCommentSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'add a new comment to an album.',
      content: {
        'application/json': {
          schema: Response,
        },
      },
    },
    500: {
      description: 'failed to add new comment.',
      content: {
        'application/json': {
          schema: Response,
        },
      },
    },
  },
})

export const createComment = new OpenAPIHono<{ Bindings: ENVS }>()

/**
 * This is the actual logic part of our route / feature.
 */
createComment.openapi(createCommentRoute, async (c) => {
  console.log('🔥 HIT', c.req.method, c.req.path)
  const db = getDB(c.env.DB)
  const body = c.req.valid('json')

  try {
    const commentId = getNewId()
    await db
      .insertInto('AlbumComments')
      .values({
        owner: body.ownerId,
        albumid: body.albumId,
        content: body.content,
        id: commentId,
      })
      .execute()
  } catch (e) {
    console.error(e)
    return c.json(
      {
        type: 'ERROR',
        message: 'Failed to add new comment.',
      },
      500
    )
  }

  return c.json(
    {
      type: 'SUCCESS',
      message: `successfully added comment.`,
    },
    201
  )
})
