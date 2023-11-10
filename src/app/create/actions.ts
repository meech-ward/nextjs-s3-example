"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { db, and, eq } from "@/db"
import { posts as postsTable } from "@/db/schema/posts"
import { media as mediaTable } from "@/db/schema/media"

import { auth } from "@/auth"

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const s3Client = new S3Client({
  region: process.env.AWS_BUCKET_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

import crypto from "crypto"

// comment out the import and use this for edge functions
// const generateFileName = (bytes = 32) => {
//   const array = new Uint8Array(bytes)
//   crypto.getRandomValues(array)
//   return [...array].map((b) => b.toString(16).padStart(2, "0")).join("")
// }

export async function createPost({
  content,
  fileId,
}: {
  content: string
  fileId?: number
}): Promise<{ failure: string } | undefined> {
  const session = await auth()

  if (!session) {
    return { failure: "not authenticated" }
  }

  if (content.length < 1) {
    return { failure: "not enough content" }
  }

  if (fileId) {
    const result = await db
      .select({ id: mediaTable.id })
      .from(mediaTable)
      .where(and(eq(mediaTable.id, fileId), eq(mediaTable.userId, session.user.id)))
      .then((rows) => rows[0])

    if (!result) {
      return { failure: "image not found" }
    }
  }

  const results = await db
    .insert(postsTable)
    .values({
      content,
      userId: session.user.id,
    })
    .returning()

  if (fileId) {
    await db.update(mediaTable).set({ postId: results[0].id }).where(eq(mediaTable.id, fileId))
  }

  revalidatePath("/")
  redirect("/")
}

const allowedFileTypes = [
  "image/jpeg",
  "image/png",
  "video/mp4",
  "video/quicktime"
]

const maxFileSize = 1048576 * 10 // 1 MB

const generateFileName = (bytes = 32) => crypto.randomBytes(bytes).toString("hex")

type SignedURLResponse = Promise<
  | { failure?: undefined; success: { url: string; id: number } }
  | { failure: string; success?: undefined }
>

type GetSignedURLParams = {
  fileType: string
  fileSize: number
  checksum: string
}
export const getSignedURL = async ({
  fileType,
  fileSize,
  checksum,
}: GetSignedURLParams): SignedURLResponse => {
  const session = await auth()

  if (!session) {
    return { failure: "not authenticated" }
  }

  if (!allowedFileTypes.includes(fileType)) {
    return { failure: "File type not allowed" }
  }

  if (fileSize > maxFileSize) {
    return { failure: "File size too large" }
  }

  const fileName = generateFileName()

  const putObjectCommand = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: fileName,
    ContentType: fileType,
    ContentLength: fileSize,
    ChecksumSHA256: checksum,
  })

  const url = await getSignedUrl(
    s3Client,
    putObjectCommand,
    { expiresIn: 60 } // 60 seconds
  )

  console.log({ success: url })

  const results = await db
    .insert(mediaTable)
    .values({
      type: fileType.startsWith("image") ? "image" : "video",
      url: url.split("?")[0],
      width: 0,
      height: 0,
      userId: session.user.id,
    })
    .returning()

  return { success: { url, id: results[0].id } }
}
