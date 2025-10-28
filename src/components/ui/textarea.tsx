import * as React from 'react';

import {cn} from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({className, ...props}, ref) => {
    
    const handleInput = (event: React.FormEvent<HTMLTextAreaElement>) => {
      const textarea = event.currentTarget;
      textarea.style.height = 'auto'; // Reset height to recalculate
      textarea.style.height = `${textarea.scrollHeight}px`; // Set to scroll height
    };

    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm max-h-[500px] overflow-y-auto resize-none',
          className
        )}
        ref={ref}
        onInput={handleInput}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export {Textarea};
