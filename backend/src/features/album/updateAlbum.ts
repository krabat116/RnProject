import { z,createRoute,OpenAPIHono } from '@hono/zod-openapi'
import { getDB } from '../../external/database/db';
import { type ENVS } from '../../environment';

/**
 * This defines the structure of our routes input or body of the request
 */
const updateUserSchema = z.object({
    name: z.string().optional().openapi({example:'Babys first moments!'}),
    description: z.string().optional().openapi({example:'A collection of beautiful baby Andreas first experiences!'}),
  }).openapi('AlbumUpdate')

const updateAlbumParams = z.object({
  albumId:z.string().min(1).openapi({
    param:{
        in:'path',
        name:'albumId'
    },
    description:'Id of album you wish to update.'
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
const updateAlbumRoute = createRoute({
    method:'patch',
    path:'/album/{albumId}',
    request: {
      params:updateAlbumParams,
      body: {
        content: {
          'multipart/form-data': {
            schema: updateUserSchema
          }
        }
      }
    },
    responses: {
        201: {
            description:'update a user object.',
            content:{
                'application/json':{
                    schema: Response
                }
            }
        },
        500: {
          description:'failed to update user.',
          content:{
            'application/json':{
              schema: Response
            }
          }
        }
    }
})

export const updateAlbum = new OpenAPIHono<{ Bindings: ENVS }>();

/**
 * This is the actual logic part of our route / feature. 
 */
updateAlbum.openapi(updateAlbumRoute,async (c) => {
    const db = getDB(c.env.DB);

    const albumId = c.req.param('albumId');
    const body = c.req.valid("form");
  
    try{
      // Configure the update query
      var query = db.updateTable('Albums').where('id','=',albumId)

      // We only update the order value if it's provided.
      if(body.name != undefined){
        query = query.set({name:body.name})
      }

      if(body.description != undefined){
        query = query.set({description:body.description})
      }

      // Execute the query
      await query.execute()

      return c.json({
        type:"SUCCESS",
        message:'successfully updated album.',
      },201)

    } catch (e) {
      console.error(e)
      return c.json({
        type:"ERROR",
        message:"Failed to update album."
      },500)
    }
  })