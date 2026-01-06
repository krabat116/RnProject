import { z,createRoute,OpenAPIHono } from '@hono/zod-openapi'
import { getObjectStorage } from '../../external/objectstorage/types';
import { ENVS } from '../../environment';
import { getDB } from '../../external/database/db';


const getUserGroupsParams = z.object({
    userId: z.string().min(1).openapi({
        param:{
            in:'path',
            name:'userId'
        },
        description:'Id of user you wish to fetch groups for.'
    })
})

const GroupType = z.object({
    description: z.string(),
    name: z.string(),
    dateCreated: z.string(),
    id: z.string(),
    lastUpdated: z.string(),
    owner: z.string(),
    emojiThumbnail: z.string(),
    members:z.array(z.string())
})

const SuccessResponse = z.object({
    type: z.string(),
    message: z.string(),
    groups:z.array(GroupType)
  })

const ErrorResponse = z.object({
    type: z.string(),
    message: z.string()
  })

/**
 * This both defines our routes setup, but also generates the openAPI documentation.
 */
const getUserGroupsRoute = createRoute({
    method:'get',
    path:'/group/all/{userId}',
    request: {
        params: getUserGroupsParams
    },
    responses: {
        200: {
            description:'Fetch all groups for a user.',
            content:{
                'application/json':{
                    schema: SuccessResponse
                }
            }
        },
        404: {
            description: 'album could not be found.',
            content:{
                'application/json':{
                    schema:ErrorResponse
                }
            }
        }
    }
})

export const getUserGroups = new OpenAPIHono<{ Bindings: ENVS }>();

/**
 * This is the actual logic part of our route / feature. 
 */
getUserGroups.openapi(getUserGroupsRoute,async (c) => {
    const db = getDB(c.env.DB);
    const userId = c.req.param('userId');
  
    try{
        const usersGroups = await db
            .selectFrom('Groups')
            .innerJoin('GroupMembers', 'Groups.id', 'GroupMembers.GroupId')
            .selectAll('Groups')
            .where('GroupMembers.userId', '=', userId)
            .execute();

            // Manually join to add array of `members`

        //TODO: need to find a better way to do this.
        const groupsWithMembers = await Promise.all(
            usersGroups.map(async(group)=>{
                const members = await db.selectFrom('GroupMembers')
                                        .innerJoin('Users','GroupMembers.userId','Users.id')
                                        // .select(['GroupMembers.userId as userId','Users.profileImage as profileImage'])
                                        .select('Users.profileImage as profileImage')
                                        .where('GroupMembers.GroupId','=',group.id)
                                        .execute()
                

                
                return {
                    ...group,
                    members:members.map(m=>m.profileImage||"none")
                
                }
            })
        )

        return c.json({
            type:"SUCCESS",
            message:"Successfully found groups for user.",
            groups:groupsWithMembers
            },200);

    } catch (e) {
        console.error(e)
        return c.json({
          type:"ERROR",
          message:"Failed to find groups for user."
        },404);
    }
  })