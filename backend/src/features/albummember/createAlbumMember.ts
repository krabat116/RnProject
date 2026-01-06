import { z,createRoute,OpenAPIHono } from '@hono/zod-openapi'
import { getDB } from '../../external/database/db';
import { ROLES, type ENVS } from '../../environment';

/**
 * This defines the structure of our routes input or body of the request
 */
const createAlbumMemberSchema = z.object({
    role: z.nativeEnum(ROLES).optional().openapi({example:ROLES.CONTRIBUTOR}),
  }).openapi('AlbumMemberCreate')

const createAlbumMemberParams = z.object({
  albumId: z.string().min(1).openapi({
      param:{
          in:'path',
          name:'albumId'
      },
      description:'Id of the album you wish to add a member to.'
  }),
  userId: z.string().min(1).openapi({
    param:{
        in:'path',
        name:'userId'
    },
    description:'Id of the user you wish to add as member of the album.'
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
const createAlbumMemberRoute = createRoute({
    method:'post',
    path:'/albummember/{albumId}/{userId}',
    request: {
      params: createAlbumMemberParams,
      body: {
        content: {
          'multipart/form-data': {
            schema: createAlbumMemberSchema
          }
        }
      }
    },
    responses: {
        201: {
            description:'add new album member.',
            content:{
                'application/json':{
                    schema: Response
                }
            }
        },
        409: {
          description:'failed to add new album member. May already exist.',
          content:{
            'application/json':{
              schema: Response
            }
          }
        }
    }
})

export const createAlbumMember = new OpenAPIHono<{ Bindings: ENVS }>();

/**
 * This is the actual logic part of our route / feature. 
 */
createAlbumMember.openapi(createAlbumMemberRoute,async (c) => {
  const db = getDB(c.env.DB);

  const albumId = c.req.param("albumId")
  const userId = c.req.param("userId")

  const body = c.req.valid("form");

  // Add user to group
  try {
    await db.insertInto('AlbumMembers')
            .values({
              AlbumId:albumId,
              userId,
              // Default to viewer for security - minimum permissions by default.
              Role: body.role || ROLES.VIEWER
            }).execute()
            
  } catch(error){
    return c.json({
      type:"ERROR",
      message:`Failed to add user to album.`,
    },201)
  }

  
  return c.json({
    type:"SUCCESS",
    message:`Sucessfully added member to album`,
  },201)
  })