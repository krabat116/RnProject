import { z,createRoute,OpenAPIHono } from '@hono/zod-openapi'
import { getDB } from '../../external/database/db';
import { ROLES, type ENVS } from '../../environment';

/**
 * This defines the structure of our routes input or body of the request
 */
const getGroupMembersParams = z.object({
  groupId: z.string().min(1).openapi({
      param:{
          in:'path',
          name:'groupId'
      },
      description:'Id of the group you wish to get members of.'
  })
})


/**
 * Defines the return type the UI should recieve.
 */
const groupMembersResponse = z.array(z.object({
  dateAdded: z.string(),
  GroupId: z.string(),
  Role: z.string(),
  userId: z.string(),
}))

/**
 * This both defines our routes setup, but also generates the openAPI documentation.
 */
const getGroupMembersRoute = createRoute({
    method:'get',
    path:'/groupmember/{groupId}',
    request: {
      params: getGroupMembersParams,
    },
    responses: {
        200: {
            description:'get group members.',
            content:{
                'application/json':{
                    schema: groupMembersResponse
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

export const getGroupMembers = new OpenAPIHono<{ Bindings: ENVS }>();

/**
 * This is the actual logic part of our route / feature. 
 */
getGroupMembers.openapi(getGroupMembersRoute,async (c) => {
  const db = getDB(c.env.DB);

  const groupId = c.req.param("groupId")

  // Add user to group
  const groupMembers = await db.selectFrom('GroupMembers')
                                .selectAll()
                                .where('GroupId','=',groupId)
                                .execute();

  
  return c.json(groupMembers,200)
  })