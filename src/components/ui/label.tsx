import * as React from "react";
import clsx from "clsx";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> { }

/**
 * Minimal Label component (shadcn-style API).
 * Works as a styled <label> with className passthrough.
 */
const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
    ({ className, ...props }, ref) => {
        return (
            <label
                ref={ref}
                className={clsx(
                    "text-sm font-medium text-slate-700",
                    // for disabled inputs nearby
                    "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                    className
                )}
                {...props}
            />
        );
    }
);
Label.displayName = "Label";

export { Label };
export default Label;