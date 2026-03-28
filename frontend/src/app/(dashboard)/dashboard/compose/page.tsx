"use client";
import { useRouter } from "next/navigation";
import { PostComposer } from "@/components/scheduler/PostComposer";

export default function ComposePage() {
  const router = useRouter();
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Post</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Create and schedule content across all your platforms
        </p>
      </div>
      <PostComposer onSuccess={() => router.push("/dashboard")} />
    </div>
  );
}
