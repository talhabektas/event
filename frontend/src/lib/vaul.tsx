"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

// Make sure this is not a public API.
const getStyle = (element: HTMLElement, style: string) => {
    if (typeof window === "undefined") return "";
    return window.getComputedStyle(element)[style as any];
};

const isInput = (el: HTMLElement) => {
    return el.tagName === "INPUT" || el.tagName === "TEXTAREA";
};

const isNotInScope = (el: HTMLElement | null, scope: React.RefObject<HTMLElement[]>) => {
    if (el === null) return true;

    for (const node of scope.current || []) {
        if (node.contains(el)) return false;
    }

    return true;
};

// Based on https://github.com/emilkowalski/cmdk
const usePointerEvents = (
    { onPointerDown, onPointerUp }: { onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void; onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void },
    ref: React.RefObject<HTMLDivElement>
) => {
    React.useEffect(() => {
        const handlePointerDown = (e: PointerEvent) => onPointerDown(e as any);
        const handlePointerUp = (e: PointerEvent) => onPointerUp(e as any);

        const doc = ref.current?.ownerDocument;

        doc?.addEventListener("pointerdown", handlePointerDown, true);
        doc?.addEventListener("pointerup", handlePointerUp, true);
        return () => {
            doc?.removeEventListener("pointerdown", handlePointerDown, true);
            doc?.removeEventListener("pointerup", handlePointerUp, true);
        };
    }, [ref, onPointerDown, onPointerUp]);
};

type DrawerDirection = "top" | "bottom" | "left" | "right";

type ScopedProps<P> = P & { __scopeVaul?: string };

const VAUL_ID = "vaul";

interface DrawerRootProps {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    direction?: DrawerDirection;
    shouldScaleBackground?: boolean;
    scrollLockTimeout?: number;
    closeThreshold?: number;
    onClose?: () => void;
    onOpen?: () => void;
    modal?: boolean;
    nested?: boolean;
}

interface DrawerContextValue {
    drawerRef: React.RefObject<HTMLDivElement>;
    overlayRef: React.RefObject<HTMLDivElement>;
    onOpenChange: (open: boolean) => void;
    direction: DrawerDirection;
    isOpen: boolean;
    hasBeenOpened: React.MutableRefObject<boolean>;
    onClose: () => void;
    onOpen: () => void;
    isDragging: React.MutableRefObject<boolean>;
    dragStartTime: React.MutableRefObject<Date>;
    isAllowedToDrag: React.MutableRefObject<boolean>;
    snapPoints: (number | string)[];
    activeSnapPoint: number | string | null;
    setActiveSnapPoint: (snapPoint: number | string | null) => void;
    closeDrawer: () => void;
}

const DrawerContext = React.createContext<DrawerContextValue | undefined>(undefined);

const useDrawerContext = () => {
    const context = React.useContext(DrawerContext);

    if (!context) {
        throw new Error("useDrawerContext must be used within a <Drawer.Root />");
    }

    return context;
};

function Root({
    open,
    onOpenChange,
    children,
    direction = "bottom",
    shouldScaleBackground = true,
    scrollLockTimeout = 500,
    closeThreshold = 0.25,
    onClose,
    onOpen,
    modal = true,
    nested = false,
}: DrawerRootProps) {
    const [isOpen, setIsOpen] = React.useState(open || false);
    const [activeSnapPoint, setActiveSnapPoint] = React.useState<number | string | null>(null);
    const drawerRef = React.useRef<HTMLDivElement>(null);
    const overlayRef = React.useRef<HTMLDivElement>(null);
    const hasBeenOpened = React.useRef(false);
    const isDragging = React.useRef(false);
    const dragStartTime = React.useRef<Date>(new Date());
    const isAllowedToDrag = React.useRef(false);
    const snapPoints = React.useRef<(number | string)[]>([]).current;

    const onOpenChangeProp = React.useCallback(
        (open: boolean) => {
            if (open) {
                hasBeenOpened.current = true;
            }
            onOpenChange?.(open);
            setIsOpen(open);
        },
        [onOpenChange]
    );

    const closeDrawer = React.useCallback(() => {
        onOpenChangeProp(false);
    }, [onOpenChangeProp]);

    React.useEffect(() => {
        if (open !== undefined && open !== isOpen) {
            onOpenChangeProp(open);
        }
    }, [open, isOpen, onOpenChangeProp]);

    return (
        <DrawerContext.Provider
            value={{
                drawerRef,
                overlayRef,
                onOpenChange: onOpenChangeProp,
                direction,
                isOpen,
                hasBeenOpened,
                onClose: () => {
                    onClose?.();
                },
                onOpen: () => {
                    onOpen?.();
                },
                isDragging,
                dragStartTime,
                isAllowedToDrag,
                snapPoints,
                activeSnapPoint,
                setActiveSnapPoint,
                closeDrawer,
            }}
        >
            <DialogPrimitive.Root
                open={isOpen}
                onOpenChange={(o) => {
                    onOpenChangeProp(o);
                }}
                shouldScaleBackground={shouldScaleBackground}
                scrollLockTimeout={scrollLockTimeout}
                modal={modal}
                nested={nested}
            >
                {children}
            </DialogPrimitive.Root>
        </DrawerContext.Provider>
    );
}

const DrawerTrigger = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<"button">>((props, ref) => {
    return <DialogPrimitive.Trigger {...props} ref={ref} />;
});

DrawerTrigger.displayName = "DrawerTrigger";

const DrawerPortal = DialogPrimitive.Portal;

const DrawerOverlay = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div">>((props, ref) => {
    const { overlayRef, onOpenChange } = useDrawerContext();
    const composedRef = React.useRef<HTMLDivElement>(null);

    React.useImperativeHandle(ref, () => composedRef.current as HTMLDivElement);
    React.useImperativeHandle(overlayRef, () => composedRef.current as HTMLDivElement);

    return (
        <DialogPrimitive.Overlay
            {...props}
            ref={composedRef}
            vaul-overlay=""
            onPointerDown={(e) => {
                // Don't close if clicking on the content
                if (e.target !== e.currentTarget) return;
                onOpenChange(false);
            }}
            className={cn("fixed inset-0 bg-black/40", props.className)}
        />
    );
});

DrawerOverlay.displayName = "DrawerOverlay";

const DrawerContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div">>(
    ({ children, ...props }, ref) => {
        const {
            drawerRef,
            direction,
            isOpen,
            hasBeenOpened,
            onClose,
            onOpen,
            isDragging,
            dragStartTime,
            isAllowedToDrag,
            snapPoints,
            activeSnapPoint,
            setActiveSnapPoint,
            onOpenChange,
            closeDrawer,
        } = useDrawerContext();
        const [y, setY] = React.useState(0);
        const [x, setX] = React.useState(0);
        const pointerStart = React.useRef(0);
        const isClosing = React.useRef(false);
        const composedRef = React.useRef<HTMLDivElement>(null);
        const scope = React.useRef<HTMLElement[]>([]);

        React.useImperativeHandle(ref, () => composedRef.current as HTMLDivElement);
        React.useImperativeHandle(drawerRef, () => composedRef.current as HTMLDivElement);

        const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
            // Don't engage drawer if the user is interacting with an input
            if (isInput(e.target as HTMLElement)) return;

            if (isNotInScope(e.target as HTMLElement, scope)) {
                isAllowedToDrag.current = true;
                isDragging.current = true;
                dragStartTime.current = new Date();
                const { clientX, clientY } = e;
                pointerStart.current = direction === "bottom" || direction === "top" ? clientY : clientX;
                setY(0);
                setX(0);
                document.body.style.cursor = "grabbing";
            } else {
                isAllowedToDrag.current = false;
            }
        };

        const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
            if (!isDragging.current) return;
            const { clientX, clientY } = e;
            const newY = clientY - pointerStart.current;
            const newX = clientX - pointerStart.current;

            if (direction === "bottom") {
                setY(Math.max(0, newY));
            } else if (direction === "top") {
                setY(Math.min(0, newY));
            } else if (direction === "right") {
                setX(Math.max(0, newX));
            } else {
                setX(Math.min(0, newX));
            }
        };

        const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
            if (!isDragging.current) return;
            isDragging.current = false;
            document.body.style.cursor = "";

            const { clientHeight, clientWidth } = composedRef.current!;
            const dragDuration = new Date().getTime() - dragStartTime.current.getTime();
            const velocity = (direction === "bottom" || direction === "top" ? y : x) / dragDuration;

            // This is the threshold for closing the drawer. It's a combination of velocity and distance.
            const closeThreshold = (direction === "bottom" || direction === "top" ? clientHeight : clientWidth) * 0.25;

            if (
                (direction === "bottom" && (y > closeThreshold || velocity > 0.5)) ||
                (direction === "top" && (y < -closeThreshold || velocity < -0.5)) ||
                (direction === "right" && (x > closeThreshold || velocity > 0.5)) ||
                (direction === "left" && (x < -closeThreshold || velocity < -0.5))
            ) {
                closeDrawer();
            }

            setY(0);
            setX(0);
        };

        usePointerEvents({ onPointerDown, onPointerMove, onPointerUp }, composedRef);

        const style: React.CSSProperties = {
            transform:
                direction === "bottom" || direction === "top"
                    ? `translate3d(0, ${y}px, 0)`
                    : `translate3d(${x}px, 0, 0)`,
        };

        return (
            <DialogPrimitive.Content
                {...props}
                ref={composedRef}
                vaul-content=""
                style={style}
                onOpenAutoFocus={(e) => {
                    e.preventDefault();
                    composedRef.current?.focus();
                }}
                className={cn(
                    "fixed flex flex-col bg-background rounded-t-[10px]",
                    direction === "bottom" && "bottom-0 left-0 right-0",
                    direction === "top" && "top-0 left-0 right-0",
                    direction === "left" && "left-0 top-0 bottom-0",
                    direction === "right" && "right-0 top-0 bottom-0",
                    props.className
                )}
            >
                {children}
            </DialogPrimitive.Content>
        );
    }
);

DrawerContent.displayName = "DrawerContent";

const DrawerTitle = React.forwardRef<HTMLHeadingElement, React.ComponentPropsWithoutRef<"h2">>((props, ref) => {
    return <DialogPrimitive.Title {...props} ref={ref} />;
});

DrawerTitle.displayName = "DrawerTitle";

const DrawerDescription = React.forwardRef<HTMLParagraphElement, React.ComponentPropsWithoutRef<"p">>((props, ref) => {
    return <DialogPrimitive.Description {...props} ref={ref} />;
});

DrawerDescription.displayName = "DrawerDescription";

const DrawerClose = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<"button">>((props, ref) => {
    return <DialogPrimitive.Close {...props} ref={ref} />;
});

DrawerClose.displayName = "DrawerClose";

export const Drawer = {
    Root,
    Trigger: DrawerTrigger,
    Portal: DrawerPortal,
    Content: DrawerContent,
    Overlay: DrawerOverlay,
    Title: DrawerTitle,
    Description: DrawerDescription,
    Close: DrawerClose,
}; 