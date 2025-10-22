
'use client';

import * as React from 'react';
import { X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandEmpty,
} from '@/components/ui/command';
import { Command as CommandPrimitive } from 'cmdk';
import { cn } from '@/lib/utils';

interface TagInputProps {
  allTags: string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export function TagInput({ allTags, value: selected, onChange, placeholder }: TagInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');

  const handleSelect = React.useCallback((tag: string) => {
    setInputValue('');
    if (!selected.includes(tag)) {
      onChange([...selected, tag]);
    }
  }, [selected, onChange]);
  
  const handleCreate = React.useCallback((tag: string) => {
    setInputValue('');
    if (tag.trim() && !selected.includes(tag.trim())) {
      onChange([...selected, tag.trim()]);
    }
  }, [selected, onChange]);

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = inputRef.current;
    if (input) {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (input.value === '' && selected.length > 0) {
          const newSelected = [...selected];
          newSelected.pop();
          onChange(newSelected);
        }
      }
      if (e.key === 'Escape') {
        input.blur();
      }
      if (e.key === "Enter" && input.value) {
        e.preventDefault();
        handleCreate(input.value);
      }
    }
  }, [selected, onChange, handleCreate]);

  const handleUnselect = React.useCallback((tag: string) => {
    onChange(selected.filter((s) => s !== tag));
  }, [selected, onChange]);

  const filteredItems = allTags.filter(
    (item) =>
      !selected.includes(item) &&
      item.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <Command onKeyDown={handleKeyDown} className="overflow-visible bg-transparent">
      <div className="group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <div className="flex flex-wrap gap-1">
          {selected.map((item) => {
            return (
              <Badge key={item} variant="outline" className="rounded-full">
                {item}
                <button
                  className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => handleUnselect(item)}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            );
          })}
          <CommandPrimitive.Input
            ref={inputRef}
            value={inputValue}
            onValueChange={setInputValue}
            onBlur={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            placeholder={placeholder || "Select tags..."}
            className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>
      <div className="relative mt-2">
        {open && (
          <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
            <CommandList>
              <CommandEmpty>
                {inputValue ? (
                    <div className="py-2 px-3 text-sm cursor-pointer"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleCreate(inputValue)
                        }}
                    >
                        Create "{inputValue}"
                    </div>
                ) : 'No tags found.'}
              </CommandEmpty>
              <CommandGroup heading="Suggestions">
                {filteredItems.map((item) => {
                  return (
                    <CommandItem
                      key={item}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onSelect={() => handleSelect(item)}
                      className="cursor-pointer"
                    >
                      {item}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </div>
        )}
      </div>
    </Command>
  );
}
