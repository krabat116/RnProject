import { z,createRoute,OpenAPIHono } from '@hono/zod-openapi'
import { getDB } from '../../external/database/db';
import { ROLES, type ENVS } from '../../environment';

/**
 * This defines the structure of our routes input or body of the request
 */
const updateGroupMemberSchema = z.object({
    role: z.nativeEnum(ROLES).optional().openapi({example:ROLES.CONTRIBUTOR}),
  }).openapi('GroupMemberUpdate')

const updateGroupMemberParams = z.object({
  groupId: z.string().min(1).openapi({
      param:{
          in:'path',
          name:'groupId'
      },
      description:'Id of the group you wish to update a member of.'
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
const updateGroupMemberRoute = createRoute({
    method:'patch',
    path:'/groupmember/{groupId}/{userId}',
    request: {
      params: updateGroupMemberParams,
      body: {
        content: {
          'multipart/form-data': {
            schema: updateGroupMemberSchema
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

export const updateGroupMember = new OpenAPIHono<{ Bindings: ENVS }>();

/**
 * This is the actual logic part of our route / feature. 
 */
updateGroupMember.openapi(updateGroupMemberRoute,async (c) => {
  const db = getDB(c.env.DB);

  const groupId = c.req.param("groupId")
  const userId = c.req.param("userId")

  const body = c.req.valid("form");

  // Add user to group
  await db.updateTable('GroupMembers')
          .set({
            Role: body.role || ROLES.VIEWER
          })
          .where('GroupId','=',groupId)
          .where('userId','=',userId)
          .execute();

  return c.json({
    type:"SUCCESS",
    message:`Successfully updated group member.`,
  },201)
  })