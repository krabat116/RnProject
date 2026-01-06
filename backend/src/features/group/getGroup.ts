import { z,createRoute,OpenAPIHono } from '@hono/zod-openapi'
import { getObjectStorage } from '../../external/objectstorage/types';
import { ENVS } from '../../environment';
import { getDB } from '../../external/database/db';


const getGroupParams = z.object({
    groupId: z.string().min(1).openapi({
        param:{
            in:'path',
            name:'groupId'
        },
        description:'Id of group you wish to fetch.'
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
})

const SuccessResponse = z.object({
    type: z.string(),
    message: z.string(),
    group:GroupType
  })

const ErrorResponse = z.object({
    type: z.string(),
    message: z.string()
  })

/**
 * This both defines our routes setup, but also generates the openAPI documentation.
 */
const getGroupRoute = createRoute({
    method:'get',
    path:'/group/{groupId}',
    request: {
        params: getGroupParams
    },
    responses: {
        200: {
            description:'Fetch an album object.',
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

export const getGroup = new OpenAPIHono<{ Bindings: ENVS }>();

/**
 * This is the actual logic part of our route / feature. 
 */
getGroup.openapi(getGroupRoute,async (c) => {
    const db = getDB(c.env.DB);
    const groupId = c.req.param('groupId');
  
    try{

        const group = await db.selectFrom('Groups')
                            .selectAll()
                            .where('id','=',groupId)
                            .executeTakeFirst();

        if(!group) throw new Error(`Unable to find group with id:${groupId}`)

        return c.json({
            type:"SUCCESS",
            message:"Successfully found group.",
            group
            },200);

    } catch (e) {
        console.error(e)
        return c.json({
          type:"ERROR",
          message:"Failed to find group."
        },404);
    }
  })