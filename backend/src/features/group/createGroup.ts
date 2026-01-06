import { z,createRoute,OpenAPIHono } from '@hono/zod-openapi'
import { getDB } from '../../external/database/db';
import { emojiRegex, ROLES, type ENVS } from '../../environment';
import { getNewId } from '../../external/ids/getId';

/**
 * This defines the structure of our routes input or body of the request
 */

const createGroupSchema = z.object({
  ownerId: z.string().openapi({example:'user2'}),
  emojiThumbnail: z.string()
  .emoji()
  .refine((value) => {
    const emojiMatches = value.match(emojiRegex);
    return emojiMatches !== null && emojiMatches.length === 1;
  }, {
    message: "String must contain exactly one emoji",
  })
  .openapi({example:'🎃'}),
  name: z.string().openapi({example:'Halloweenies'}),
  description: z.string().openapi({example:'The spoopiest group who ever did live.'}),
  }).openapi('GroupCreate')


/**
 * Defines the return type the UI should recieve.
 */
const SuccessResponse = z.object({
  type: z.string(),
  message: z.string(),
  groupId:z.string(),
})

const ErrorResponse = z.object({
  type: z.string(),
  message: z.string(),
})


/**
 * This both defines our routes setup, but also generates the openAPI documentation.
 */
const createGroupRoute = createRoute({
    method:'post',
    path:'/group',
    request: {
        body: {
          content: {
            'application/json': {
              schema: createGroupSchema
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

export const createGroup = new OpenAPIHono<{ Bindings: ENVS }>();

/**
 * This is the actual logic part of our route / feature. 
 */
createGroup.openapi(createGroupRoute,async (c) => {
    const db = getDB(c.env.DB);

    const body = c.req.valid('json');
    const newGroupId = getNewId();

    try{
      console.log(body)
      
      await db.insertInto('Groups').values({
        id:newGroupId,
        owner: body.ownerId,
        name: body.name,
        description: body.description,
        emojiThumbnail:body.emojiThumbnail
      }).execute();

      await db.insertInto('GroupMembers').values({
        GroupId:newGroupId,
        userId:body.ownerId,
        Role:ROLES.OWNER
      }).execute()


    } catch (e) {
      console.error(e)
      return c.json({
        type:"ERROR",
        message:"Failed to create new group."
      },500)
    }
  
    return c.json({
      type:"SUCCESS",
      message:`successfully created new group with id:${newGroupId}`,
      groupId: newGroupId
    },201)
  })