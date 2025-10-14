import { z,createRoute,OpenAPIHono } from '@hono/zod-openapi'
import { getObjectStorage } from '../../external/objectstorage/types';
import { ENVS } from '../../environment';
import { getDB } from '../../external/database/db';


const getAllImagesParams = z.object({
    albumId: z.string().min(1).openapi({
        param:{
            in:'path',
            name:'albumId'
        },
        description:'Id of the album you wish to get the images for.'
    })
})

const imageSchema = z.array(z.object({
        description: z.string().nullable(),
        id: z.string(),
        albumid: z.string(),
        createdAt: z.string().nullable(),
        heightpx: z.number().int().positive(),
        imageUrl: z.string(),
        order: z.number().int(),
        owner: z.string(),
        thumbnailUrl: z.string(),
        widthpx: z.number().int().positive(),
}))

const Response = z.object({
    type: z.string(),
    message: z.string()
  })

/**
 * This both defines our routes setup, but also generates the openAPI documentation.
 */
const getAllImagesRoute = createRoute({
    method:'get',
    path:'/image/all/{albumId}',
    request: {
        params: getAllImagesParams
    },
    responses: {
        200: {
            description:'Fetch all image objects for an album.',
            content:{
                'application/json':{
                    schema: imageSchema
                }
            }
        },
        404: {
            description: 'Image could not be found in bucket.',
            content:{
                'application/json':{
                    schema:Response
                }
            }
        }
    }
})

export const getAllImages = new OpenAPIHono<{ Bindings: ENVS }>();

/**
 * This is the actual logic part of our route / feature. 
 */
getAllImages.openapi(getAllImagesRoute,async (c) => {
    const objectStorage = getObjectStorage(c.env)
    const db = getDB(c.env.DB);

    const albumId = c.req.param('albumId')
  
    // get all images for an album
    const albumImages = await db.selectFrom('Images')
                                .selectAll()
                                .where('albumid','=',albumId)
                                .execute()

    const images = await Promise.all(
        albumImages.map(async img => {
            return {
                ...img,
                imageUrl:await objectStorage.getPresignedURL(img.id)
            } 
            
        })
    )
  
    return c.json(images,200)
  })
