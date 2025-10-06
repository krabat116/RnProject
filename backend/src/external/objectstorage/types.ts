import { AwsClient } from "aws4fetch";
import { type ENVS } from "../../environment";
import { env } from "hono/adapter";

export type CreateObjectStorageItem = ReadableStream | ArrayBuffer | ArrayBufferView | string | null | Blob
export type ReadObjectStorageItem = R2ObjectBody | R2Object | null
/**
 * This is the abstract interface we will use to implement
 * object storage. For now we will implement an R2 version,
 * but may require an S3 or others.
 */
export interface IObjectStorageService {

    /**
     * Given an object name, return the object if found, otherwise throw an error
     */
    get(objectId:string):Promise<ReadObjectStorageItem>;

    put(objectId:string,data:CreateObjectStorageItem):void;

    delete(objectId:string):void;
}


/**
 * A concrete object storage service implementation for
 * Cloudflare R2
 */
export class R2ObjectStorageService implements IObjectStorageService {
    private R2:R2Bucket;
    private AWSClient: AwsClient;
    private BucketName:string;
    private AccountId:string;

    constructor(
        binding:R2Bucket,
        accessKeyId:string,
        secretAccessKey:string,
        bucketName:string,
        accountId:string,
    ){
        this.R2 = binding;
        this.AWSClient = new AwsClient({
            accessKeyId: accessKeyId || "",
            secretAccessKey: secretAccessKey || "",
          });
        this.BucketName = bucketName;
        this.AccountId = accountId;
        
    }

    async get(objectId:string): Promise<ReadObjectStorageItem> {
        return await this.R2.get(objectId)
    }

    async put(objectId:string,data:CreateObjectStorageItem): Promise<void> {
        await this.R2.put(objectId,data)
    }

    async getPresignedURL(objectId:string): Promise<string> {
        const bucketName = this.BucketName;
        const accountId = this.AccountId;
    
        const url = new URL(
          `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${objectId}`
                // `https://56315bca94c9b2bf7144927de2630892.r2.cloudflarestorage.com/${objectId}`
        );
    
        // Specify a custom expiry for the presigned URL, in seconds
        const validPeriod = 60 * 60
        url.searchParams.set("X-Amz-Expires", validPeriod.toString());
        const signed = await this.AWSClient.sign(
          new Request(url, {
            method: "GET",
          }),
          {
            aws: { signQuery: true },
          }
        );

        return signed.url;
    }

    async delete(objectId:string): Promise<void> {
        await this.R2.delete(objectId);
    }
}


/**
 * 
 */
export function getObjectStorage(envs:ENVS){
    return new R2ObjectStorageService(
        envs.OBJECT_STORAGE,
        envs.R2_ACCESS_KEY_ID,
        envs.R2_SECRET_ACCESS_KEY,
        envs.BUCKET_NAME,
        envs.ACCOUNT_ID,
    );
}
