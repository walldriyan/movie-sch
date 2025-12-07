import * as React from 'react';

import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({ className, ...props }, ref) => {

    React.useEffect(() => {
      const textarea = (ref as React.RefObject<HTMLTextAreaElement>)?.current;
      if (textarea) {
        const handleInput = () => {
          textarea.style.height = 'auto'; // Reset height to recalculate
          textarea.style.height = `${textarea.scrollHeight}px`; // Set to scroll height
        };

        textarea.addEventListener('input', handleInput);

        // Initial resize
        handleInput();

        return () => {
          textarea.removeEventListener('input', handleInput);
        };
      }
    }, [ref]);

    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border-2 border-white/15 bg-white/5 px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-white/25 hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm max-h-[500px] overflow-y-auto resize-none transition-all duration-200',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
