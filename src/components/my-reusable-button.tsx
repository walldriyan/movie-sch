// 1. අවශ්‍ය, packages, import, කර, ගැනීම
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils" // Tailwind, class, merge, කරන, helper, function, එක

// 2. Button, එකේ, සියලුම, variants, (පෙනුම්), සහ, sizes, (ප්‍රමාණ), නිර්වචනය, කිරීම
// `class-variance-authority` (cva), package, එක, මේ, සඳහා, යොදා, ගනී.
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// 3. React, component, එක, සඳහා, TypeScript, interface, එක, නිර්මාණය, කිරීම
// මෙය, HTML, <button> element, එකේ, props, සහ, අප, විසින්, නිර්වචනය, කළ, variants, extend, කරයි.
export interface MyButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean // Radix, Slot, එක, සඳහා, යොදා, ගනී
}

// 4. Reusable, React, component, එක, නිර්මාණය, කිරීම
const MyReusableButton = React.forwardRef<HTMLButtonElement, MyButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    // `asChild` prop, එක, true, නම්, button, එකක්, වෙනුවට, child, element, එක, render, කරයි.
    // උදා: <MyReusableButton asChild><Link href="/">Home</Link></MyReusableButton>
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        // `cn`, function, එක, මගින්, cva, එකෙන්, එන, class, නම්, සහ, বাইরেන්, එන, class, නම්, merge, කරයි.
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
MyReusableButton.displayName = "MyReusableButton"

export { MyReusableButton, buttonVariants }
