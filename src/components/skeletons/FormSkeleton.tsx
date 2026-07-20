import { Skeleton } from "@/components/ui/skeleton";

interface FormSkeletonProps {
  rows?: number;
}

export default function FormSkeleton({
  rows = 6,
}: FormSkeletonProps) {
  return (
    <div className="max-w-3xl space-y-8">
      <Skeleton className="h-8 w-52" />

      <div className="grid grid-cols-[180px_1fr] gap-x-8 gap-y-6">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="contents"
          >
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Skeleton className="h-10 w-28" />
      </div>
    </div>
  );
}