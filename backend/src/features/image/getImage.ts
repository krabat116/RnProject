import { z,createRoute,OpenAPIHono } from '@hono/zod-openapi'
import { getObjectStorage } from '../../external/objectstorage/types';
import { ENVS } from '../../environment';


const getImageParams = z.object({
    id: z.string().min(1).openapi({
        param:{
            in:'path',
            name:'id'
        },
        description:'Id of image you wish to fetch.'
    })
})

const getImageResponseSchema = z.object({
    presignedUrl: z.string()
})
const Response = z.object({
    type: z.string(),
    message: z.string()
  })

/**
 * This both defines our routes setup, but also generates the openAPI documentation.
 */
const getImageRoute = createRoute({
    method:'get',
    path:'/image/{id}',
    request: {
        params: getImageParams
    },
    responses: {
        200: {
            description:'Fetch an image object.',
            content:{
                'application/json':{
                    schema: getImageResponseSchema
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

export const getImage = new OpenAPIHono<{ Bindings: ENVS }>();

/**
 * This is the actual logic part of our route / feature. 
 */
getImage.openapi(getImageRoute,async (c) => {
    const objectStorage = getObjectStorage(c.env)
    const imageId = c.req.param('id')
  
    // Need to check image exists first.
    const imageMeta = await objectStorage.get(imageId)

    if(imageMeta == null) {
        return c.json({
            type:'ERROR',
            message:`Failed to fetch image; An image with that id was not found.`
          },404)
    }

    const image = await objectStorage.getPresignedURL(imageId)
  
    return c.json({
      presignedUrl:image
    },200)
  })