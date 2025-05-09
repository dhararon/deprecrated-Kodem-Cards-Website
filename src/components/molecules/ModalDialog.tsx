import * as React from "react";
import { X } from "lucide-react";
import { Dialog, DialogPortal, DialogOverlay, DialogContent, DialogClose, DialogTitle, DialogDescription } from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/atoms/Button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/atoms/Card";

export interface ModalDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    title?: React.ReactNode;
    description?: React.ReactNode;
    children?: React.ReactNode;
    footer?: React.ReactNode;
    closeButton?: boolean;
    className?: string;
    contentClassName?: string;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const maxWidthMap = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
};

/**
 * ModalDialog - Un componente para mostrar contenido en un diálogo modal
 */
export function ModalDialog({
    isOpen,
    onOpenChange,
    title,
    description,
    children,
    footer,
    closeButton = true,
    className,
    contentClassName,
    maxWidth = 'md'
}: ModalDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogPortal>
                <DialogOverlay
                    className={cn(
                        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                        className
                    )}
                />
                <DialogContent
                    className={cn(
                        "fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border-none shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] p-0",
                        maxWidthMap[maxWidth],
                        contentClassName
                    )}
                >
                    <Card className="border-none">
                        {(title || description) && (
                            <CardHeader className="relative pb-0">
                                {title && <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>}
                                {description && <DialogDescription className="text-sm text-muted-foreground">{description}</DialogDescription>}
                                {closeButton && (
                                    <DialogClose asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-2 top-2 h-8 w-8 rounded-full p-0"
                                            aria-label="Cerrar"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </DialogClose>
                                )}
                            </CardHeader>
                        )}
                        {children && <CardContent>{children}</CardContent>}
                        {footer && <CardFooter>{footer}</CardFooter>}
                    </Card>
                </DialogContent>
            </DialogPortal>
        </Dialog>
    );
} 