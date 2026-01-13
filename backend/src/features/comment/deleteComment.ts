import { z,createRoute,OpenAPIHono } from '@hono/zod-openapi'
import { getDB } from '../../external/database/db';
import { type ENVS } from '../../environment';

/**
 * This defines the structure of our routes input or body of the request
 */
const deleteCommentParams = z.object({
    commentId: z.string().min(1).openapi({
        param:{
            in:'path',
            name:'commentId'
        },
        example:'comment1'
    }),
  }).openapi('CommentDeleteParam')

  const deleteCommentSchema = z.object({
    ownerId: z.string().min(1).openapi({example:'user1'}),
  }).openapi('CommentDelete')

/**
 * Defines the return type the UI should recieve./
 */
const Response = z.object({
    type: z.string(),
    message: z.string(),
})


/**
 * This both defines our routes setup, but also generates the openAPI documentation.
 */
const deleteCommentRoute = createRoute({
    method:'delete',
    path:'/comment/{commentId}',
    request: {
        params:deleteCommentParams,
        body:{
            content: {
                'application/json':{
                    schema: deleteCommentSchema
                }
            }
        }
    },
    responses: {
        201: {
            description:'Delete a comment from a post.',
            content:{
                'application/json':{
                    schema: Response
                }
            }
        },
        500: {
            description:'Failed to delete a comment from a post.',
            content:{
                'application/json':{
                    schema: Response
                }
            }
        }
    }
})

export const deleteComment = new OpenAPIHono<{ Bindings: ENVS }>();

/**
 * This is the actual logic part of our route / feature. 
 */
deleteComment.openapi(deleteCommentRoute,async (c) => {
    const db = getDB(c.env.DB);

    const commentId = c.req.param('commentId');
    const commentOwnerId = c.req.valid('json').ownerId
  
    try{
    const result = await db.deleteFrom('AlbumComments')
            .where('id','=',commentId)
            .where('owner','=',commentOwnerId)
            .returning('id')
            .execute();

    if(!result.length){
        throw new Error('No row was deleted.')
    }

    }catch(error){
        return c.json({
            type:"ERROR",
            message:`Failed to delete comment.`,
          },500)
    }

    return c.json({
      type:"SUCCESS",
      message:`successfully deleted comment.`,
    },201)
  })