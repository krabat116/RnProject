import { z,createRoute,OpenAPIHono } from '@hono/zod-openapi'
import { getDB } from '../../external/database/db';
import { ROLES, type ENVS } from '../../environment';

/**
 * This defines the structure of our routes input or body of the request
 */
const updateAlbumMemberSchema = z.object({
    role: z.nativeEnum(ROLES).optional().openapi({example:ROLES.CONTRIBUTOR}),
  }).openapi('GroupMemberUpdate')

const updateAlbumMemberParams = z.object({
  albumId: z.string().min(1).openapi({
      param:{
          in:'path',
          name:'albumId'
      },
      description:'Id of the album you wish to update a member of.'
  }),
  userId: z.string().min(1).openapi({
    param:{
        in:'path',
        name:'userId'
    },
    description:'Id of the user you wish to update.'
})
})


/**
 * Defines the return type the UI should recieve.
 */
const Response = z.object({
  type: z.string(),
  message: z.string()
})


/**
 * This both defines our routes setup, but also generates the openAPI documentation.
 */
const updateAlbumMemberRoute = createRoute({
    method:'patch',
    path:'/albummember/{albumId}/{userId}',
    request: {
      params: updateAlbumMemberParams,
      body: {
        content: {
          'multipart/form-data': {
            schema: updateAlbumMemberSchema
          }
        }
      }
    },
    responses: {
        201: {
            description:'update a group member.',
            content:{
                'application/json':{
                    schema: Response
                }
            }
        }
    }
})

export const updateAlbumMember = new OpenAPIHono<{ Bindings: ENVS }>();

/**
 * This is the actual logic part of our route / feature. 
 */
updateAlbumMember.openapi(updateAlbumMemberRoute,async (c) => {
  const db = getDB(c.env.DB);

  const albumId = c.req.param("albumId")
  const userId = c.req.param("userId")

  const body = c.req.valid("form");

  // Add user to group
  await db.updateTable('AlbumMembers')
          .set({
            Role: body.role || ROLES.VIEWER
          })
          .where('AlbumId','=',albumId)
          .where('userId','=',userId)
          .execute();

  return c.json({
    type:"SUCCESS",
    message:`Successfully updated album member.`,
  },201)
  })