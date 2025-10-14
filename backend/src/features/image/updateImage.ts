import { z,createRoute,OpenAPIHono } from '@hono/zod-openapi'
import { getObjectStorage } from '../../external/objectstorage/types';
import { getDB } from '../../external/database/db';
import { type ENVS } from '../../environment';
import { getNewId } from '../../external/ids/getId';

/**
 * This defines the structure of our routes input or body of the request
 */
const updateImageSchema = z.object({
    description: z.string().optional().nullable().openapi({example:"A photo of a cow. Moo!"}),
    order: z.coerce.number().int().positive().optional().openapi({example:1}),
  }).openapi('ImageUpdate')

const updateImageParams = z.object({
  id:z.string().min(1).openapi({
    param:{
        in:'path',
        name:'id'
    },
    description:'Id of image you wish to fetch.'
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
const updateImageRoute = createRoute({
    method:'patch',
    path:'/image/{id}',
    request: {
      params:updateImageParams,
      body: {
        content: {
          'application/json': {
            schema: updateImageSchema
          }
        }
      }
    },
    responses: {
        201: {
            description:'update an image object.',
            content:{
                'application/json':{
                    schema: Response
                }
            }
        },
        500: {
          description:'failed to update image.',
          content:{
            'application/json':{
              schema: Response
            }
          }
        }
    }
})

export const updateImage = new OpenAPIHono<{ Bindings: ENVS }>();

/**
 * This is the actual logic part of our route / feature. 
 */
updateImage.openapi(updateImageRoute,async (c) => {
    const db = getDB(c.env.DB);

    const imageId = c.req.param('id');
    const body = c.req.valid("json");
  
    try{
      //TODO: check if this image or orderid is taken?
      const albumImages = await db.selectFrom('Images')
                        .select(['id','order'])
                        .where('albumid','=',qb => qb
                            .selectFrom('Images')
                            .select('albumid')
                            .where('id','=',imageId)
                        ).execute();

      if(albumImages.find(i => i.order == body.order && i.id != imageId) != undefined){
        // error - this image ordering is already taken by another image.
        return c.json({
          type:"ERROR",
          message:`Failed to update image; An image already has the order ${body.order}`
        },500)
      }
      // Configure the update query
      var query = db.updateTable('Images')
                      // a description can be removed, so we need to allow nulls.
                      .set({description:body.description || null})
                      .where('id','=',imageId);

      // We only update the order value if it's provided.
      if(body.order != undefined) query = query.set({order:body.order})

      // Execute the query
      await query.execute()

    } catch (e) {
      console.error(e)
      return c.json({
        type:"ERROR",
        message:"Failed to update image."
      },500)
    }
  
    return c.json({
      type:"SUCCESS",
      message:`successfully updated image with id:${imageId}`,
    },201)
  })