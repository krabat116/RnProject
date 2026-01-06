import { z,createRoute,OpenAPIHono } from '@hono/zod-openapi'
import { getDB } from '../../external/database/db';
import { ROLES, type ENVS } from '../../environment';

/**
 * This defines the structure of our routes input or body of the request
 */
const getAlbumMembersParams = z.object({
  albumId: z.string().min(1).openapi({
      param:{
          in:'path',
          name:'albumId'
      },
      description:'Id of the album you wish to get members of.'
  })
})


/**
 * Defines the return type the UI should recieve.
 */
const albumMembersResponse = z.array(z.object({
  dateAdded: z.string(),
  AlbumId: z.string(),
  Role: z.string(),
  userId: z.string(),
}))

/**
 * This both defines our routes setup, but also generates the openAPI documentation.
 */
const getAlbumMembersRoute = createRoute({
    method:'get',
    path:'/albummember/{albumId}',
    request: {
      params: getAlbumMembersParams,
    },
    responses: {
        200: {
            description:'get group members.',
            content:{
                'application/json':{
                    schema: albumMembersResponse
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

export const getAlbumMembers = new OpenAPIHono<{ Bindings: ENVS }>();

/**
 * This is the actual logic part of our route / feature. 
 */
getAlbumMembers.openapi(getAlbumMembersRoute,async (c) => {
  const db = getDB(c.env.DB);

  const albumId = c.req.param("albumId")

  // Add user to group
  const albumMembers = await db.selectFrom('AlbumMembers')
                                .selectAll()
                                .where('AlbumId','=',albumId)
                                .execute();

  
  return c.json(albumMembers,200)
  })