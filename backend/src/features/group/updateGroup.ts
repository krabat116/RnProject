import { z,createRoute,OpenAPIHono } from '@hono/zod-openapi'
import { getDB } from '../../external/database/db';
import { emojiRegex, type ENVS } from '../../environment';

/**
 * This defines the structure of our routes input or body of the request
 */
const updateGroupSchema = z.object({
  // ownerId: z.string().openapi({example:'user1'}),// Disabled for now, but could be used to transfer ownership
  emojiThumbnail: z.string().emoji().refine((value) => {
    const emojiMatches = value.match(emojiRegex);
    return emojiMatches !== null && emojiMatches.length === 1;
  }, {
    message: "String must contain exactly one emoji",
  }).optional().openapi({example:'🎎'}),
  name: z.string().optional().openapi({example:'The Doll House'}),
  description: z.string().optional().openapi({example:'Just the groups of girlies.'}),
  }).openapi('GroupUpdate')

const updateGroupParams = z.object({
  groupId:z.string().min(1).openapi({
    param:{
        in:'path',
        name:'groupId'
    },
    description:'Id of group you wish to update.'
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
const updateGroupRoute = createRoute({
    method:'patch',
    path:'/group/{groupId}',
    request: {
      params:updateGroupParams,
      body: {
        content: {
          'multipart/form-data': {
            schema: updateGroupSchema
          }
        }
      }
    },
    responses: {
        201: {
            description:'update a group.',
            content:{
                'application/json':{
                    schema: Response
                }
            }
        },
        500: {
          description:'failed to update group.',
          content:{
            'application/json':{
              schema: Response
            }
          }
        }
    }
})

export const updateGroup = new OpenAPIHono<{ Bindings: ENVS }>();

/**
 * This is the actual logic part of our route / feature. 
 */
updateGroup.openapi(updateGroupRoute,async (c) => {
    const db = getDB(c.env.DB);

    const groupId = c.req.param('groupId');
    const body = c.req.valid("form");
  
    try{
      // Configure the update query
      var query = db.updateTable('Groups').where('id','=',groupId)

      // We only update the order value if it's provided.
      if(body.name != undefined){
        query = query.set({name:body.name})
      }

      if(body.description != undefined){
        query = query.set({description:body.description})
      }

      if(body.emojiThumbnail != undefined){
        query = query.set({emojiThumbnail:body.emojiThumbnail})
      }

      // Execute the query
      await query.execute()

      return c.json({
        type:"SUCCESS",
        message:'successfully updated group.',
      },201)

    } catch (e) {
      console.error(e)
      return c.json({
        type:"ERROR",
        message:"Failed to update group."
      },500)
    }
  })