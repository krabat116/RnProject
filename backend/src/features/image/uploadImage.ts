import { z, createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { getObjectStorage } from '../../external/objectstorage/types'
import { getDB } from '../../external/database/db'
import { type ENVS } from '../../environment'
import { getNewId } from '../../external/ids/getId'

/**
 * This defines the structure of our routes input or body of the request
 */
const uploadImageSchema = z
  .object({
    ownerId: z.string().openapi({ example: 'user1' }),
    albumId: z.string().openapi({ example: 'album1' }),
    description: z
      .string()
      .optional()
      .openapi({ example: 'A photo of a cow. Moo!' }),
    order: z.coerce.number().int().positive().openapi({ example: 1 }),
    widthPx: z.coerce.number().int().positive().openapi({ example: 1080 }),
    heightPx: z.coerce.number().int().positive().openapi({ example: 1920 }),
    image: z.string(),
    mimeType: z.string(),
    // z.instanceof(File)
    //         .refine((file) => file.type.startsWith('image/'), {
    //             message: 'Only image files are allowed.',
    //         }).openapi({type:'string',format:'binary'})
  })
  .openapi('ImageCreate')

/**
 * Defines the return type the UI should recieve.
 */
const Response = z.object({
  type: z.string(),
  message: z.string(),
})

/**
 * This both defines our routes setup, but also generates the openAPI documentation.
 */
const createImageRoute = createRoute({
  method: 'post',
  path: '/image',
  request: {
    body: {
      content: {
        'application/json': {
          schema: uploadImageSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'upload a new image object.',
      content: {
        'application/json': {
          schema: Response,
        },
      },
    },
    500: {
      description: 'failed to save new image.',
      content: {
        'application/json': {
          schema: Response,
        },
      },
    },
  },
})

function base64ToFile(
  base64String: string,
  fileName: string,
  mimeType: string
) {
  // Remove data URL scheme if present
  const base64Data = base64String.replace(/^data:.+;base64,/, '')
  const byteCharacters = atob(base64Data) // Decode Base64 string
  const byteNumbers = new Array(byteCharacters.length)

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }

  const byteArray = new Uint8Array(byteNumbers)
  const blob = new Blob([byteArray], { type: mimeType })
  return new File([blob], fileName, { type: mimeType })
}

export const uploadImage = new OpenAPIHono<{ Bindings: ENVS }>()

/**
 * This is the actual logic part of our route / feature.
 */
uploadImage.openapi(createImageRoute, async (c) => {
  const objectStorage = getObjectStorage(c.env)
  const db = getDB(c.env.DB)

  console.log('[BINDINGS]', {
    hasDB: !!c.env.DB,
    bucketName: c.env.BUCKET_NAME,
    publicBase: c.env.R2_PUBLIC_BASE_URL,
  })

  try {
    const body = c.req.valid('json')
    console.log('[REQUEST]', {
      albumId: body.albumId,
      ownerId: body.ownerId,
      order: body.order,
    })

    const newImageId = getNewId()

    const fileName = `${newImageId}.jpg` // + body.mimeType.split('/')[-1];

    const imageFile = base64ToFile(body.image, fileName, 'image/jpeg')

    if (imageFile instanceof File) {
      //TODO: check if this image or orderid is taken?
      const albumImages = await db
        .selectFrom('Images')
        .select(['id', 'order'])
        .where('albumid', '=', body.albumId)
        .execute()

      console.log(albumImages)
      if (
        albumImages.length > 0 &&
        albumImages.find((i) => i.order == body.order) != undefined
      ) {
        // error - this image ordering is already taken by another image.
        return c.json(
          {
            type: 'ERROR',
            message: `Failed to upload new image; An image already has the order ${body.order}`,
          },
          500
        )
      }
      const publicBase = c.env.R2_PUBLIC_BASE_URL
      const imageUrl = `${publicBase}/${fileName}`

      await objectStorage.put(fileName, imageFile)

      await db
        .insertInto('Images')
        .values({
          id: newImageId,
          albumid: body.albumId,
          owner: body.ownerId,
          description: body.description,
          heightpx: body.heightPx,
          widthpx: body.widthPx,
          imageUrl,
          thumbnailUrl: imageUrl,
          order: body.order,
        })
        .execute()
      console.log('[ABOUT TO INSERT]', { imageUrl, fileName, publicBase })

      // Update album image count.
      const albumImageCount = await db
        .selectFrom('Images')
        .where('albumid', '=', body.albumId)
        .select((eb) => eb.fn.count<number>('id').as('imageCount'))
        .executeTakeFirst()

      await db
        .updateTable('Albums')
        .where('id', '=', body.albumId)
        .set({
          numImages: albumImageCount?.imageCount ?? 0,
        })
        .execute()
      const inserted = await db
        .selectFrom('Images')
        .select(['id', 'thumbnailUrl', 'imageUrl'])
        .where('id', '=', newImageId)
        .executeTakeFirst()

      console.log('[INSERT VALUES]', { imageUrl, thumbnailUrl: imageUrl })
      console.log('[DB INSERT RESULT]', inserted)

      return c.json(
        {
          type: 'SUCCESS',
          message: `successfully saved image with id:${newImageId}`,
        },
        201
      )

      // } catch (e) {
      //   console.error(e)
      //   return c.json({
      //     type:"ERROR",
      //     message:"Failed to upload new image."
      //   },500)
      // }
    }
  } catch (e) {
    console.error(e)
    return c.json(
      {
        type: 'ERROR',
        message: 'Failed to upload new image.',
      },
      500
    )
  }
})
