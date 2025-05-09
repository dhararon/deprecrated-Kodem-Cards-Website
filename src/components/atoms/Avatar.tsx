import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const avatarVariants = cva(
    "relative flex shrink-0 overflow-hidden rounded-full",
    {
        variants: {
            size: {
                sm: "h-8 w-8",
                md: "h-10 w-10",
                lg: "h-12 w-12",
                xl: "h-16 w-16",
            },
        },
        defaultVariants: {
            size: "md",
        },
    }
)

export interface AvatarProps
    extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof avatarVariants> { }

function Avatar({ className, size, ...props }: AvatarProps) {
    return (
        <span
            className={cn(avatarVariants({ size, className }))}
            {...props}
        />
    )
}

function AvatarImage({
    className,
    ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            className={cn("aspect-square h-full w-full", className)}
            {...props}
        />
    )
}

function AvatarFallback({
    className,
    ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
    return (
        <span
            className={cn(
                "flex h-full w-full items-center justify-center rounded-full bg-slate-100 text-slate-900",
                className
            )}
            {...props}
        />
    )
}

export { Avatar, AvatarImage, AvatarFallback } 