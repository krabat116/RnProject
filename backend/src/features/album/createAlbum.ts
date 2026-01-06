import { z,createRoute,OpenAPIHono } from '@hono/zod-openapi'
import { getDB } from '../../external/database/db';
import { ROLES, type ENVS } from '../../environment';
import { getNewId } from '../../external/ids/getId';

/**
 * This defines the structure of our routes input or body of the request
 */
const createAlbumSchema = z.object({
  ownerId: z.string().openapi({example:'user1'}),
  name: z.string().openapi({example:'French Architecture'}),
  description: z.string().openapi({example:'a collection of the most beautiful examples of historic french architecture taken from our trip around all of france.'}),
  // imageIds: z.array(z.string()) //NOTE: temporarily disabled, these steps might not be simultaneous.
  }).openapi('AlbumCreate')


/**
 * Defines the return type the UI should recieve.
 */
const SuccessResponse = z.object({
  type: z.string(),
  message: z.string(),
  albumId:z.string(),
})

const ErrorResponse = z.object({
  type: z.string(),
  message: z.string(),
})


/**
 * This both defines our routes setup, but also generates the openAPI documentation.
 */
const createAlbumRoute = createRoute({
    method:'post',
    path:'/album',
    request: {
        body: {
          content: {
            'application/json': {
              schema: createAlbumSchema
            }
          }
        }
    },
    responses: {
        201: {
            description:'create a new album object.',
            content:{
                'application/json':{
                    schema: SuccessResponse
                }
            }
        },
        500: {
          description:'failed to create new album.',
          content:{
            'application/json':{
              schema: ErrorResponse
            }
          }
        }
    }
})

export const createAlbum = new OpenAPIHono<{ Bindings: ENVS }>();

/**
 * This is the actual logic part of our route / feature. 
 */
createAlbum.openapi(createAlbumRoute,async (c) => {
    const db = getDB(c.env.DB);

    const body = c.req.valid("json");
    const newAlbumId = getNewId();

    try{
      
      await db.insertInto('Albums').values({
        id:newAlbumId,
        owner: body.ownerId,
        name: body.name,
        description: body.description,
        thumbnailUrl:''
      }).execute();

      await db.insertInto('AlbumMembers').values({
        AlbumId:newAlbumId,
        userId:body.ownerId,
        Role:ROLES.OWNER
      }).execute()


    } catch (e) {
      console.error(e)
      return c.json({
        type:"ERROR",
        message:"Failed to create new album."
      },500)
    }
  
    return c.json({
      type:"SUCCESS",
      message:`successfully created new album with id:${newAlbumId}`,
      albumId: newAlbumId
    },201)
  })