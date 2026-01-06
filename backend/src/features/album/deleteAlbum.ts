import { z,createRoute,OpenAPIHono } from '@hono/zod-openapi'
import { getDB } from '../../external/database/db';
import { type ENVS } from '../../environment';

/**
 * This defines the structure of our routes input or body of the request
 */
const deleteAlbumParams = z.object({
    albumId: z.string().min(1).openapi({
        param:{
            in:'path',
            name:'albumId'
        },
        description:'Id of album you wish to delete.'
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
const deleteAlbumRoute = createRoute({
    method:'delete',
    path:'/album/{albumId}',
    request: {
        params:deleteAlbumParams
    },
    responses: {
        200: {
            description:'delete an album by id.',
            content:{
                'application/json':{
                    schema: Response
                }
            }
        },
        500: {
          description:'failed to delete the album.',
          content:{
            'application/json':{
              schema: Response
            }
          }
        }
    }
})

export const deleteAlbum = new OpenAPIHono<{ Bindings: ENVS }>();

/**
 * This is the actual logic part of our route / feature. 
 */
deleteAlbum.openapi(deleteAlbumRoute,async (c) => {
    const db = getDB(c.env.DB);

    const albumId = c.req.param('albumId')
  
    try{

        //TODO: Run these parallel.
        // Delete all images associated with album
        await db.deleteFrom('Images').where('albumid','=',albumId).execute();

        // Delete associated comments.
        await db.deleteFrom('AlbumComments').where('albumid','=',albumId).execute();

        // Delete Associate members
        await db.deleteFrom('AlbumMembers').where('AlbumId','=',albumId).execute();
        await db.deleteFrom('AlbumSharedGroups').where('AlbumId','=',albumId).execute();

        // Delete Public Links
        await db.deleteFrom('AlbumPublicLinks').where('Albumid','=',albumId).execute();

    
        // delete album itself.
        await db.deleteFrom('Albums').where('id','=',albumId).execute();

        return c.json({
            type:"SUCCESS",
            message:`Successfully deleted album with id: ${albumId}`,
          },200)

    }catch(error){
        return c.json({
            type:"ERROR",
            message:"Failed to delete album."
        },500)
    }
  })