import { z,createRoute,OpenAPIHono } from '@hono/zod-openapi'
import { getDB } from '../../external/database/db';
import { ROLES, type ENVS } from '../../environment';

/**
 * This defines the structure of our routes input or body of the request
 */
const createGroupMemberSchema = z.object({
    role: z.nativeEnum(ROLES).optional().openapi({example:ROLES.CONTRIBUTOR}),
    userId: z.string().optional().openapi({example: 'user1'}),
    phone: z.string().optional().openapi({example:'0400333333'})
  }).openapi('GroupMemberCreate')

const createGroupMemberParams = z.object({
  groupId: z.string().min(1).openapi({
      param:{
          in:'path',
          name:'groupId'
      },
      description:'Id of the group you wish to add a member to.'
  }),
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
const createGroupMemberRoute = createRoute({
    method:'post',
    path:'/groupmember/{groupId}',
    request: {
      params: createGroupMemberParams,
      body: {
        content: {
          'application/json': {
            schema: createGroupMemberSchema
          }
        }
      }
    },
    responses: {
        201: {
            description:'add new group member.',
            content:{
                'application/json':{
                    schema: Response
                }
            }
        },
        409: {
          description:'failed to add new group member. May already exist.',
          content:{
            'application/json':{
              schema: Response
            }
          }
        }
    }
})

type userIdExists = {
  id: string;
} | undefined

export const createGroupMember = new OpenAPIHono<{ Bindings: ENVS }>();

/**
 * This is the actual logic part of our route / feature. 
 */
createGroupMember.openapi(createGroupMemberRoute,async (c) => {
  const db = getDB(c.env.DB);

  const groupId = c.req.param("groupId")
  // const userId = c.req.param("userId")

  const body = c.req.valid("json");

  // Add user to group
  try {


    if(body.phone != undefined){
      const userPhoneExists = await db.selectFrom('Users').where('Users.phone','=',body.phone).select('id').executeTakeFirst()

      if(!userPhoneExists){
        //user hasn't joined yet, create delayed invite.
        await db.insertInto('GroupInvite').values({
          GroupId: groupId,
          invitedPhoneNum:body.phone,
          Role: ROLES.VIEWER
        }).execute()

      }else{
        //add as member
        await db.insertInto('GroupMembers').values({
          GroupId: groupId,
          userId: userPhoneExists.id,
          Role: ROLES.VIEWER
        }).execute()
      }



    }

    if(body.userId != undefined){
      const userUserIdExists = await db.selectFrom('Users').where('email','=',body.userId).select('id').executeTakeFirst()

      if(!userUserIdExists) throw Error(`Couldnt find user with id ${body.userId} in database` )


      await db.insertInto('GroupMembers').values({
        GroupId: groupId,
        userId: userUserIdExists.id,
        Role: ROLES.VIEWER
      }).execute()

    }
  } catch(error){
    return c.json({
      type:"ERROR",
      message:`Failed to add user to group.`,
    },201)
  }

  
  return c.json({
    type:"SUCCESS",
    message:`Successfully added member to group`,
  },201)
  })