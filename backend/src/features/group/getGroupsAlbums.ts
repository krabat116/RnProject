import { z,createRoute,OpenAPIHono } from '@hono/zod-openapi'
import { ENVS } from '../../environment';
import { getDB } from '../../external/database/db';


const getGroupsAlbumsParams = z.object({
    groupId: z.string().min(1).openapi({
        param:{
            in:'path',
            name:'groupId'
        },
        description:'Id of user you wish to fetch groups for.'
    })
})

const GroupAlbumType = z.object({
    description: z.string(),
    name: z.string(),
    dateCreated: z.string(),
    id: z.string(),
    lastUpdated: z.string(),
    owner: z.string(),
    numImages: z.number().nullish(),
    thumbnailUrl: z.string(),
})

const SuccessResponse = z.object({
    type: z.string(),
    message: z.string(),
    albums:z.array(GroupAlbumType)
  })

const ErrorResponse = z.object({
    type: z.string(),
    message: z.string()
  })

/**
 * This both defines our routes setup, but also generates the openAPI documentation.
 */
const getGroupAlbumsRoute = createRoute({
    method:'get',
    path:'/group/albums/{groupId}',
    request: {
        params: getGroupsAlbumsParams
    },
    responses: {
        200: {
            description:'Fetch all groups for a user.',
            content:{
                'application/json':{
                    schema: SuccessResponse
                }
            }
        },
        404: {
            description: 'album could not be found.',
            content:{
                'application/json':{
                    schema:ErrorResponse
                }
            }
        }
    }
})

export const getGroupAlbums = new OpenAPIHono<{ Bindings: ENVS }>();

/**
 * This is the actual logic part of our route / feature. 
 */
getGroupAlbums.openapi(getGroupAlbumsRoute,async (c) => {
    const db = getDB(c.env.DB);
    const groupId = c.req.param('groupId');
  
    try{
        const groupAlbums = await db.selectFrom('AlbumSharedGroups')
        .innerJoin('Albums','Albums.id','AlbumId')
        .where('GroupId','=',groupId)
        .orderBy('createdAt asc')
        .selectAll('Albums')
        .execute()

        return c.json({
            type:"SUCCESS",
            message:"Successfully found groups for user.",
            albums:groupAlbums
            },200);

    } catch (e) {
        console.error(e)
        return c.json({
          type:"ERROR",
          message:"Failed to find groups for user."
        },404);
    }
  })