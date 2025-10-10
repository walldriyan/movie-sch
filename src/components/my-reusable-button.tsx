/*
  ================================================================
  පියවර 3: Reusable Button Component එක නිර්මාණය කිරීම
  ================================================================
  මෙය අපගේ ප්‍රධාන component එකයි.
  - `cva` (class-variance-authority): මගින් button එකේ විවිධ පෙනුම් (`variant`) 
    සහ ප්‍රමාණ (`size`) වලට අදාළ Tailwind class නම් නිර්වචනය කරයි.
  - `React.forwardRef`: මගින් මෙම component එකට `ref` එකක් pass කිරීමට ඉඩ ලබා දේ.
  - `MyButtonProps` interface: එක මගින් component එකට ලබාදිය හැකි `props` 
    (variant, size, className, ආදිය) නිර්වචනය කරයි.
  - `asChild` prop: එක මගින්, මෙම button එක <Link> tag එකක් වැනි වෙනත් 
    element එකක් ලෙස හැසිරවීමට ඉඩ ලබා දේ.
*/
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Button එකේ විවිධ පෙනුම් සහ ප්‍රමාණ සඳහා class නම් නිර්වචනය කිරීම
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
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

// Button component එකේ props සඳහා TypeScript interface එක
export interface MyButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

// Reusable Button Component එක
const MyReusableButton = React.forwardRef<HTMLButtonElement, MyButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
MyReusableButton.displayName = "MyReusableButton"

export { MyReusableButton, buttonVariants }
