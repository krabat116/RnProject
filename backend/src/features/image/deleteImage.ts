import { z,createRoute,OpenAPIHono } from '@hono/zod-openapi'
import { getObjectStorage } from '../../external/objectstorage/types';
import { getDB } from '../../external/database/db';
import { type ENVS } from '../../environment';

/**
 * This defines the structure of our routes input or body of the request
 */
const deleteImageParams = z.object({
    id: z.string().min(1).openapi({
        param:{
            in:'path',
            name:'id'
        },
        description:'Id of image you wish to delete.'
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
const deleteImageRoute = createRoute({
    method:'delete',
    path:'/image/{id}',
    request: {
        params:deleteImageParams
    },
    responses: {
        201: {
            description:'delete an existing image by id.',
            content:{
                'application/json':{
                    schema: Response
                }
            }
        },
        500: {
          description:'failed to delete the image.',
          content:{
            'application/json':{
              schema: Response
            }
          }
        }
    }
})

export const deleteImage = new OpenAPIHono<{ Bindings: ENVS }>();

/**
 * This is the actual logic part of our route / feature. 
 */
deleteImage.openapi(deleteImageRoute,async (c) => {
    const objectStorage = getObjectStorage(c.env);
    const db = getDB(c.env.DB);

    const imageId = c.req.param('id')
  
    try{
        const imageAlbumId = await db.selectFrom('Images')
                                    .select('albumid')
                                    .where('id','=',imageId)
                                    .executeTakeFirst()

        //TODO: Run these parallel.
        await objectStorage.delete(imageId)
        await db.deleteFrom('Images').where('id','=',imageId).execute();

        // Update album image count.
        if(!imageAlbumId){
            throw Error('Image deleted successfully, but failed to update album image count.')
        }

        const albumImageCount = await db.selectFrom('Images')
        .where('albumid','=',imageAlbumId.albumid)
        .select((eb) => eb.fn.count<number>('id').as('imageCount') )
        .executeTakeFirst();

        await db.updateTable('Albums').where('id','=',imageAlbumId.albumid).set({
        numImages : albumImageCount?.imageCount ?? 0
        }).execute();

    }catch(error){
        return c.json({
            type:"ERROR",
            message:"Failed to delete image."
        },500)
    }


  
    return c.json({
      type:"SUCCESS",
      message:`Successfully deleted image with id: ${imageId}`,
    },201)
  })