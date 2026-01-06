import { z,createRoute,OpenAPIHono } from '@hono/zod-openapi'
import { getDB } from '../../external/database/db';
import { emojiRegex, ROLES, type ENVS } from '../../environment';
import { getNewId } from '../../external/ids/getId';

/**
 * This defines the structure of our routes input or body of the request
 */

const removeGroupAlbumParams = z.object({
  groupId: z.string().min(1).openapi({
      param:{
          in:'path',
          name:'groupId'
      },
      description:'Id of group you wish to fetch.'
  }),
  albumId: z.string().min(1).openapi({
    param:{
        in:'path',
        name:'albumId'
    },
    description:'Id of group you wish to fetch.'
}),

})


/**
 * Defines the return type the UI should recieve.
 */
const SuccessResponse = z.object({
  type: z.string(),
  message: z.string(),
})

const ErrorResponse = z.object({
  type: z.string(),
  message: z.string(),
})


/**
 * This both defines our routes setup, but also generates the openAPI documentation.
 */
const removeGroupAlbumRoute = createRoute({
    method:'delete',
    path:'/group/{groupId}/{albumId}',
    request: {
      params:removeGroupAlbumParams,
    },
    responses: {
        201: {
            description:'create a new album object.',
            content:{
                'application/json':{
                    schema: SuccessResponse
                }
            }
        },
        500: {
          description:'failed to create new album.',
          content:{
            'application/json':{
              schema: ErrorResponse
            }
          }
        }
    }
})

export const removeGroupAlbum = new OpenAPIHono<{ Bindings: ENVS }>();

/**
 * This is the actual logic part of our route / feature. 
 */
removeGroupAlbum.openapi(removeGroupAlbumRoute,async (c) => {
    const db = getDB(c.env.DB);

    const albumId = c.req.param('albumId');
    const groupId = c.req.param('groupId');

    try{
      //TODO: need to check only the owner can remove.
      await db.deleteFrom('AlbumSharedGroups')
        .where('AlbumId','=',albumId)
        .where('GroupId','=',groupId)
        .execute()


    } catch (e) {
      console.error(e)
      return c.json({
        type:"ERROR",
        message:"Failed to create new group."
      },500)
    }
  
    return c.json({
      type:"SUCCESS",
      message:`successfully removed album(s) from group`,
    },201)
  })