import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useMobile } from "@/hooks/use-mobile"

const Credenza = ({
    children,
    ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => {
    const isMobile = useMobile()
    const CredenzaComponent = isMobile ? DrawerPrimitive.Root : Dialog

    return (
        <CredenzaComponent {...props}>
            {children}
        </CredenzaComponent>
    )
}

const CredenzaTrigger = ({
    children,
    ...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger>) => {
    const isMobile = useMobile()
    const CredenzaComponent = isMobile ? DrawerPrimitive.Trigger : Dialog.Trigger

    return (
        <CredenzaComponent {...props}>
            {children}
        </CredenzaComponent>
    )
}

const CredenzaClose = ({
    children,
    ...props
}: React.ComponentProps<typeof DrawerPrimitive.Close>) => {
    const isMobile = useMobile()
    const CredenzaComponent = isMobile ? DrawerPrimitive.Close : Dialog.Close

    return (
        <CredenzaComponent {...props}>
            {children}
        </CredenzaComponent>
    )
}

const CredenzaContent = React.forwardRef<
    React.ElementRef<typeof DrawerPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => {
    const isMobile = useMobile()

    if (isMobile) {
        return (
            <DrawerPrimitive.Portal>
                <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80" />
                <DrawerPrimitive.Content
                    ref={ref}
                    className={cn(
                        "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background",
                        className
                    )}
                    {...props}
                >
                    <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
                    {children}
                </DrawerPrimitive.Content>
            </DrawerPrimitive.Portal>
        )
    }

    return (
        <DialogContent ref={ref} className={className} {...props}>
            {children}
        </DialogContent>
    )
})
CredenzaContent.displayName = "CredenzaContent"

const CredenzaDescription = ({
    className,
    ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) => {
    const isMobile = useMobile()
    const CredenzaComponent = isMobile
        ? DrawerPrimitive.Description
        : Dialog.Description

    return (
        <CredenzaComponent
            className={cn("text-sm text-muted-foreground", className)}
            {...props}
        />
    )
}

const CredenzaHeader = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
    const isMobile = useMobile()

    if (isMobile) {
        return (
            <div
                className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
                {...props}
            />
        )
    }

    return (
        <div
            className={cn(
                "flex flex-col space-y-1.5 text-center sm:text-left",
                className
            )}
            {...props}
        />
    )
}

const CredenzaTitle = ({
    className,
    ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) => {
    const isMobile = useMobile()
    const CredenzaComponent = isMobile ? DrawerPrimitive.Title : Dialog.Title

    return (
        <CredenzaComponent
            className={cn(
                "text-lg font-semibold leading-none tracking-tight",
                className
            )}
            {...props}
        />
    )
}

const CredenzaBody = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
    return (
        <div className={cn("flex-1 p-4", className)} {...props} />
    )
}

const CredenzaFooter = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
    const isMobile = useMobile()

    if (isMobile) {
        return (
            <div
                className={cn("mt-auto flex flex-col gap-2 p-4", className)}
                {...props}
            />
        )
    }

    return (
        <div
            className={cn(
                "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
                className
            )}
            {...props}
        />
    )
}

export {
    Credenza,
    CredenzaTrigger,
    CredenzaClose,
    CredenzaContent,
    CredenzaDescription,
    CredenzaHeader,
    CredenzaTitle,
    CredenzaBody,
    CredenzaFooter,
} 