'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

export interface FilterState {
  sortBy: string;
  genres: string[];
  yearRange: [number, number];
  ratingRange: [number, number];
  timeFilter: 'all' | 'today' | 'this_week' | 'this_month';
}

interface AdvancedFilterDialogProps {
  allGenres: string[];
  currentFilters: FilterState;
  onApplyFilters: (filters: FilterState) => void;
  triggerButton: React.ReactNode;
}

export default function AdvancedFilterDialog({
  allGenres,
  currentFilters,
  onApplyFilters,
  triggerButton,
}: AdvancedFilterDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterState>(currentFilters);

  const handleApply = () => {
    onApplyFilters(localFilters);
    setIsOpen(false);
  };
  
  const handleReset = () => {
    const defaultFilters: FilterState = {
      sortBy: 'updatedAt-desc',
      genres: [],
      yearRange: [1980, new Date().getFullYear()],
      ratingRange: [0, 10],
      timeFilter: 'all',
    };
    setLocalFilters(defaultFilters);
    onApplyFilters(defaultFilters);
    setIsOpen(false);
  };
  
  // When dialog opens, sync local state with current props
  React.useEffect(() => {
    if (isOpen) {
      setLocalFilters(currentFilters);
    }
  }, [isOpen, currentFilters]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Advanced Filters</DialogTitle>
          <DialogDescription>
            Refine your movie search with more specific criteria.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Sort By */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sort-by" className="text-right">
              Sort By
            </Label>
            <Select
              value={localFilters.sortBy}
              onValueChange={(value) => setLocalFilters(prev => ({ ...prev, sortBy: value }))}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select sorting" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updatedAt-desc">Newest</SelectItem>
                <SelectItem value="updatedAt-asc">Oldest</SelectItem>
                <SelectItem value="imdbRating-desc">Rating: High to Low</SelectItem>
                <SelectItem value="imdbRating-asc">Rating: Low to High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Separator />

          {/* Genres */}
          <div>
            <Label className="mb-3 block text-center">Genres</Label>
            <ScrollArea className="h-40 w-full rounded-md border">
              <div className="p-4 grid grid-cols-2 gap-2">
                {allGenres.map((genre) => (
                  <div key={genre} className="flex items-center space-x-2">
                    <Checkbox
                      id={`genre-${genre}`}
                      checked={localFilters.genres.includes(genre)}
                      onCheckedChange={(checked) => {
                        setLocalFilters(prev => ({
                          ...prev,
                          genres: checked
                            ? [...prev.genres, genre]
                            : prev.genres.filter(g => g !== genre),
                        }));
                      }}
                    />
                    <label
                      htmlFor={`genre-${genre}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {genre}
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <Separator />
          
          {/* Year Range */}
          <div>
            <Label className="mb-3 block text-center">
              Release Year: {localFilters.yearRange[0]} - {localFilters.yearRange[1]}
            </Label>
            <Slider
              value={localFilters.yearRange}
              onValueChange={(value: [number, number]) => setLocalFilters(prev => ({ ...prev, yearRange: value }))}
              min={1950}
              max={new Date().getFullYear()}
              step={1}
            />
          </div>

          <Separator />
          
          {/* Rating Range */}
          <div>
            <Label className="mb-3 block text-center">
              IMDb Rating: {localFilters.ratingRange[0].toFixed(1)} - {localFilters.ratingRange[1].toFixed(1)}
            </Label>
            <Slider
              value={localFilters.ratingRange}
              onValueChange={(value: [number, number]) => setLocalFilters(prev => ({ ...prev, ratingRange: value }))}
              min={0}
              max={10}
              step={0.1}
            />
          </div>
        </div>

        <DialogFooter className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={handleReset}>Reset Filters</Button>
          <Button onClick={handleApply}>Apply Filters</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
