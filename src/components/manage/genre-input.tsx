
'use client';

import * as React from 'react';
import { X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Command as CommandPrimitive } from 'cmdk';
import { cn } from '@/lib/utils';
import GENRES_DATA from '@/lib/genres.json';

const ALL_GENRES = GENRES_DATA.genres;

interface GenreInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export function GenreInput({ value: selectedGenres, onChange, placeholder }: GenreInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');

  const handleSelect = React.useCallback((genre: string) => {
    setInputValue('');
    if (!selectedGenres.includes(genre)) {
      onChange([...selectedGenres, genre]);
    }
  }, [selectedGenres, onChange]);

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = inputRef.current;
    if (input) {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (input.value === '' && selectedGenres.length > 0) {
          const newSelected = [...selectedGenres];
          newSelected.pop();
          onChange(newSelected);
        }
      }
      if (e.key === 'Escape') {
        input.blur();
      }
    }
  }, [selectedGenres, onChange]);

  const handleUnselect = React.useCallback((genre: string) => {
    onChange(selectedGenres.filter((s) => s !== genre));
  }, [selectedGenres, onChange]);

  const filteredGenres = ALL_GENRES.filter(
    (genre) =>
      !selectedGenres.includes(genre) &&
      genre.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <Command onKeyDown={handleKeyDown} className="overflow-visible bg-transparent">
      <div className="group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <div className="flex flex-wrap gap-1">
          {selectedGenres.map((genre) => {
            return (
              <Badge key={genre} variant="secondary">
                {genre}
                <button
                  className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUnselect(genre);
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => handleUnselect(genre)}
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
            placeholder={placeholder || "Select genres..."}
            className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>
      <div className="relative mt-2">
        {open && filteredGenres.length > 0 ? (
          <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
            <CommandList>
              <CommandGroup heading="Suggestions">
                {filteredGenres.map((genre) => {
                  return (
                    <CommandItem
                      key={genre}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onSelect={() => handleSelect(genre)}
                      className="cursor-pointer"
                    >
                      {genre}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </div>
        ) : null}
      </div>
    </Command>
  );
}
