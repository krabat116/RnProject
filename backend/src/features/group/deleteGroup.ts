import { z,createRoute,OpenAPIHono } from '@hono/zod-openapi'
import { getDB } from '../../external/database/db';
import { type ENVS } from '../../environment';

/**
 * This defines the structure of our routes input or body of the request
 */
const deleteGroupParams = z.object({
    groupId: z.string().min(1).openapi({
        param:{
            in:'path',
            name:'groupId'
        },
        description:'Id of group you wish to delete.'
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
const deleteGroupRoute = createRoute({
    method:'delete',
    path:'/group/{groupId}',
    request: {
        params:deleteGroupParams
    },
    responses: {
        200: {
            description:'delete an group by id.',
            content:{
                'application/json':{
                    schema: Response
                }
            }
        },
        500: {
          description:'failed to delete the group.',
          content:{
            'application/json':{
              schema: Response
            }
          }
        }
    }
})

export const deleteGroup = new OpenAPIHono<{ Bindings: ENVS }>();

/**
 * This is the actual logic part of our route / feature. 
 */
deleteGroup.openapi(deleteGroupRoute,async (c) => {
    const db = getDB(c.env.DB);

    const groupId = c.req.param('groupId')
  
    try{

        //TODO: Run these parallel.
        // Delete all objects associated with album
        await db.deleteFrom('GroupInvite').where('GroupId','=',groupId).execute();
        await db.deleteFrom('GroupMembers').where('GroupId','=',groupId).execute();
        await db.deleteFrom('AlbumSharedGroups').where('GroupId','=',groupId).execute();


        // delete group itself.
        await db.deleteFrom('Groups').where('id','=',groupId).execute();

        return c.json({
            type:"SUCCESS",
            message:`Successfully deleted group with id: ${groupId}`,
          },200)

    }catch(error){
        return c.json({
            type:"ERROR",
            message:"Failed to delete group."
        },500)
    }
  })