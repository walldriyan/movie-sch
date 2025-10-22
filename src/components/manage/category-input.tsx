
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

interface CategoryInputProps {
  allCategories: string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export function CategoryInput({ allCategories, value: selected, onChange, placeholder }: CategoryInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');

  const handleSelect = React.useCallback((category: string) => {
    setInputValue('');
    if (!selected.includes(category)) {
      onChange([...selected, category]);
    }
  }, [selected, onChange]);
  
  const handleCreate = React.useCallback((category: string) => {
    setInputValue('');
    if (category.trim() && !selected.includes(category.trim())) {
      onChange([...selected, category.trim()]);
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

  const handleUnselect = React.useCallback((category: string) => {
    onChange(selected.filter((s) => s !== category));
  }, [selected, onChange]);

  const filteredItems = allCategories.filter(
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
              <Badge key={item} variant="secondary">
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
            placeholder={placeholder || "Select categories..."}
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
                ) : 'No categories found.'}
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
