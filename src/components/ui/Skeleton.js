import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "../../lib/utils";
import * as React from "react";
const Skeleton = React.forwardRef(({ className, ...props }, ref) => {
    return (_jsx("div", { ref: ref, className: cn("relative overflow-hidden rounded-md bg-muted/60 animate-pulse", className), ...props, children: _jsx("div", { className: "absolute inset-0 -translate-x-full animate-shimmer", style: {
                background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent)"
            } }) }));
});
Skeleton.displayName = "Skeleton";
export { Skeleton };
