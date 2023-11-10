import Image from "next/image"
import Link from "next/link"
import { type Post } from "@/db/queries/postsFeed"
import PostActions from "@/components/post-actions"

import timeAgoShort from "@/utils/timeAgoShort"

import { likePost, commentPost, repostPost, sharePost, deletePost } from "./actions"

export default function FeedPost({ post }: { post: Post }) {
  function PostMedia() {
    if (!post.media) {
      return null
    }
    if (post.media.type === "image") {
      return (
        <Link href={post.media.url}>
          <div className="rounded-xl w-fill aspect-square relative overflow-hidden">
            <Image className="object-cover" src={post.media.url} alt={post.content} fill={true} />
          </div>
        </Link>
      )
    }

    if (post.media.type === "video") {
      return (
        <Link href={post.media.url}>
          <video className="rounded-xl object-contain max-w-full" src={post.media.url} controls />
        </Link>
      )
    }
  }
  return (
    <article className="flex flex-col gap-4 py-4 relative">
      <div className="flex gap-4 items-start">
        <Link href={`/${post.user.id}`}>
          <div className="rounded-full h-10 w-10 overflow-hidden relative">
            <Image
              className="object-cover"
              src={post.user.image || "https://www.gravatar.com/avatar/?d=mp"}
              alt={post.user.name || "user image"}
              priority={true}
              fill={true}
            />
          </div>
        </Link>
        <div className="flex flex-col gap-2 w-full">
          <div className="flex justify-between w-full">
            <Link href={`/${post.user.id}`}>
              <div>{post.user.name}</div>
            </Link>
            <p className="dark:text-neutral-400 text-neutral-600">{timeAgoShort(new Date(post.createdAt))}</p>
          </div>
          <Link href={`/post/${post.id}`}>
            <p className="font-light">{post.content}</p>
          </Link>
          <PostMedia />
          <PostActions
            onLike={likePost.bind(null, post.id)}
            onComment={commentPost.bind(null, post.id)}
            onRepost={repostPost.bind(null, post.id)}
            onShare={sharePost.bind(null, post.id)}
            onDelete={deletePost.bind(null, post.id)}
          />
        </div>
      </div>
    </article>
  )
}
