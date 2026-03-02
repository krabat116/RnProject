import { z,createRoute,OpenAPIHono } from '@hono/zod-openapi'
import { getDB } from '../../external/database/db';
import { type ENVS } from '../../environment';

/**
 * This defines the structure of our routes input or body of the request
 */
const deleteGroupMemberParams = z.object({
  groupId: z.string().min(1).openapi({
      param:{
          in:'path',
          name:'groupId'
      },
      description:'Id of the group you wish to get members of.'
  }),
  userId: z.string().min(1).openapi({
    param:{
        in:'path',
        name:'userId'
    },
    description:'Id of the user you wish to remove from the group.'
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
const deleteGroupMemberRoute = createRoute({
    method:'delete',
    path:'/groupmember/{groupId}/{userId}',
    request: {
      params: deleteGroupMemberParams,
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

export const deleteGroupMember = new OpenAPIHono<{ Bindings: ENVS }>();

/**
 * This is the actual logic part of our route / feature. 
 */
deleteGroupMember.openapi(deleteGroupMemberRoute,async (c) => {
  const db = getDB(c.env.DB);

  const groupId = c.req.param("groupId")
  const userId = c.req.param("userId")

  await db.deleteFrom('GroupMembers')
          .where('GroupId','=',groupId)
          .where('userId','=',userId)
          .execute();

  
  return c.json({
    type:'SUCCESS',
    message:`Successfully deleted user from group.`
  },200)
  })