
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

/**
 * ReusableTestButton component
 * 
 * This is an example of a reusable button component built on top of 
 * the ShadCN UI Button. It can be easily copied to other projects.
 * 
 * @param {object} props - The props for the component.
 * @param {string} [props.label='Send Mail'] - The text to display on the button.
 */
export default function ReusableTestButton({ label = 'Send Mail' }: { label?: string }) {
  const handleClick = () => {
    alert('Reusable Test Button Clicked!');
  };

  return (
    <div className="p-8 flex justify-center items-center">
      <Button onClick={handleClick} variant="outline" size="lg">
        <Mail className="mr-2 h-5 w-5" />
        {label}
      </Button>
    </div>
  );
}
