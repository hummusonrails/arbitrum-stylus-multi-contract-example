import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="skeleton"
      className={cn("bg-accent inline-block animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }
