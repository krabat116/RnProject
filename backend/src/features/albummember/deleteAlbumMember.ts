import { z,createRoute,OpenAPIHono } from '@hono/zod-openapi'
import { getDB } from '../../external/database/db';
import { type ENVS } from '../../environment';

/**
 * This defines the structure of our routes input or body of the request
 */
const deleteAlbumMemberParams = z.object({
  albumId: z.string().min(1).openapi({
      param:{
          in:'path',
          name:'albumId'
      },
      description:'Id of the album you wish to delete members from.'
  }),
  userId: z.string().min(1).openapi({
    param:{
        in:'path',
        name:'userId'
    },
    description:'Id of the user you wish to remove from the album.'
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
const deleteAlbumMemberRoute = createRoute({
    method:'delete',
    path:'/albummember/{albumId}/{userId}',
    request: {
      params: deleteAlbumMemberParams,
    },
    responses: {
        200: {
            description:'delete group members.',
            content:{
                'application/json':{
                    schema: Response
                }
            }
        },
        // 404: {
        //   description:'could not find group',
        //   content:{
        //     'application/json':{
        //       schema: Response
        //     }
        //   }
        // }
    }
})

export const deleteAlbumMember = new OpenAPIHono<{ Bindings: ENVS }>();

/**
 * This is the actual logic part of our route / feature. 
 */
deleteAlbumMember.openapi(deleteAlbumMemberRoute,async (c) => {
  const db = getDB(c.env.DB);

  const albumId = c.req.param("albumId")
  const userId = c.req.param("userId")

  await db.deleteFrom('AlbumMembers')
          .where('AlbumId','=',albumId)
          .where('userId','=',userId)
          .execute();

  
  return c.json({
    type:'SUCCESS',
    message:`Successfully deleted user from album.`
  },200)
  })