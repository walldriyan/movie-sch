'use client';

import React, { useState, useEffect, useTransition, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Switch } from '@/components/ui/switch';

import dynamic from 'next/dynamic';
import { Skeleton } from '../ui/skeleton';

const QuillEditor = dynamic(() => import('@/components/quill-editor'), {
  ssr: false,
  loading: () => <Skeleton className="h-[200px] w-full" />,
});

import { ArrowLeft, Upload, X, Image as ImageIcon, Loader2, AlertCircle, Plus, Trash2, ChevronsUpDown, Check, PlusCircle, Eye, Users, Lock, Unlock, Info, Film, Clapperboard, MonitorPlay, Globe, FileText, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import type { Post, Group } from '@prisma/client';
import type { PostFormData, MediaLink } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { GenreInput } from './genre-input';
import { getSeries, createSeries, getGroupsForForm, getPostCreationStatus } from '@/lib/actions';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getCustomContentTypes, addCustomContentType } from '@/lib/actions/settings';
import { useSession } from 'next-auth/react';
import { ROLES } from '@/lib/permissions';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const postSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  posterUrl: z.string().optional(),
  description: z.string().min(10, 'Description is required'),
  year: z.coerce.number().optional(),
  duration: z.string().optional(),
  genres: z.array(z.string()).optional(),
  directors: z.string().optional(),
  mainCast: z.string().optional(),
  imdbRating: z.coerce.number().min(0).max(10).optional(),
  rottenTomatoesRating: z.coerce.number().min(0).max(100).optional(),
  googleRating: z.coerce.number().min(0).max(100).optional(),
  mediaLinks: z.array(
    z.object({
      type: z.enum(['trailer', 'image']),
      url: z.string().url('Invalid URL'),
    })
  ).optional(),
  type: z.enum(['MOVIE', 'TV_SERIES', 'OTHER']),
  customContentLabel: z.string().optional(),
  seriesId: z.coerce.number().optional(),
  orderInSeries: z.coerce.number().optional(),
  visibility: z.enum(['PUBLIC', 'GROUP_ONLY']),
  groupId: z.string().optional(),
  isLockedByDefault: z.boolean(),
  requiresExamToUnlock: z.boolean(),
});

type PostFormValues = z.infer<typeof postSchema>;

interface PostFormProps {
  editingPost?: Post & {
    mediaLinks: MediaLink[];
    metaData?: { key: string; value: string }[];
  } | null;
  onFormSubmit: (data: PostFormData, postId?: number) => void;
  onBack: () => void;
  isSubmitting: boolean;
  debugError?: { message: string } | null;
}

// --- Icons & Helpers ---
function StepIcon({ step, currentStep, onClick, label }: { step: string, currentStep: string, onClick: () => void, label: string }) {
  const steps = ['details', 'description', 'visibility'];
  const stepIndex = steps.indexOf(step);
  const currentIndex = steps.indexOf(currentStep);
  const isCompleted = stepIndex < currentIndex;
  const isActive = step === currentStep;

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 cursor-pointer group select-none",
        isActive ? "text-primary" : isCompleted ? "text-white" : "text-muted-foreground"
      )}
    >
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm font-bold transition-all",
        isActive ? "border-primary bg-primary/20 text-primary" :
          isCompleted ? "border-transparent bg-white text-black" :
            "border-white/20 bg-transparent text-muted-foreground group-hover:border-white/40"
      )}>
        {isCompleted ? <Check className="w-5 h-5" /> : stepIndex + 1}
      </div>
      <span className="font-medium capitalize hidden md:block">{label}</span>
    </div>
  );
}

function StepperLine({ active }: { active: boolean }) {
  return <div className={cn("h-[2px] w-8 md:w-24 mx-2 transition-colors", active ? "bg-primary" : "bg-white/10")} />
}

// --- Content Type Selector ---
function ContentTypeSelector({ value, onChange, customTypes, onCustomCreate, onCustomSelect, customLabel, session }: any) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const isSuperAdmin = session?.data?.user?.role === ROLES.SUPER_ADMIN;
  const standardTypes = [
    { value: 'MOVIE', label: 'Movie', icon: Clapperboard },
    { value: 'TV_SERIES', label: 'TV Series', icon: MonitorPlay },
    { value: 'OTHER', label: 'Other', icon: Globe },
  ];
  const displayLabel = value === 'OTHER' && customLabel ? customLabel : standardTypes.find(t => t.value === value)?.label || "Select Type";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button variant="outline" role="combobox" className={cn("w-full justify-between bg-black/20 border-white/10 hover:bg-black/30 rounded-xl h-12", !value && "text-muted-foreground")}>
            <span className="truncate flex items-center gap-2">
              {value === 'MOVIE' && <Clapperboard className="w-4 h-4 text-blue-400" />}
              {value === 'TV_SERIES' && <MonitorPlay className="w-4 h-4 text-purple-400" />}
              {value === 'OTHER' && <Globe className="w-4 h-4 text-green-400" />}
              {displayLabel}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-zinc-950 border-white/10 rounded-xl">
        <Command>
          <CommandInput placeholder="Search type..." value={searchQuery} onValueChange={setSearchQuery} />
          <CommandList>
            <CommandEmpty>
              {isSuperAdmin && searchQuery ? (
                <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => { onCustomCreate(searchQuery); setOpen(false); }}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Create "{searchQuery}"
                </Button>
              ) : "No type found."}
            </CommandEmpty>
            <CommandGroup heading="Standard">
              {standardTypes.map((t) => (
                <CommandItem key={t.value} value={t.label} onSelect={() => { onChange(t.value as any); onCustomSelect(''); setOpen(false); }} className="cursor-pointer">
                  <t.icon className="mr-2 h-4 w-4 opacity-70" /> {t.label}
                </CommandItem>
              ))}
            </CommandGroup>
            {customTypes.length > 0 && (
              <CommandGroup heading="Custom">
                {customTypes.map((ct: string) => (
                  <CommandItem key={ct} value={ct} onSelect={() => { onChange('OTHER'); onCustomSelect(ct); setOpen(false); }}>
                    <Globe className="mr-2 h-4 w-4 opacity-70" /> {ct}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// --- Series Selector ---
function SeriesCombobox({ field, seriesList, onSeriesCreated }: any) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!searchQuery) return;
    setIsCreating(true);
    try {
      const newSeries = await createSeries(searchQuery);
      onSeriesCreated(newSeries);
      field.onChange(newSeries.id);
      setOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button variant="outline" role="combobox" className={cn("w-full justify-between bg-black/20 border-white/10 hover:bg-black/30 rounded-xl h-12", !field.value && "text-muted-foreground")}>
            {field.value ? seriesList.find((s: any) => s.id === field.value)?.title : "Select series"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-zinc-950 border-white/10 rounded-xl">
        <Command>
          <CommandInput placeholder="Search series..." value={searchQuery} onValueChange={setSearchQuery} />
          <CommandList>
            <CommandEmpty>
              <Button variant="ghost" className="w-full justify-start text-sm" onClick={handleCreate} disabled={isCreating}>
                {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />} Create "{searchQuery}"
              </Button>
            </CommandEmpty>
            <CommandGroup>
              {seriesList.map((s: any) => (
                <CommandItem key={s.id} value={s.title} onSelect={() => { field.onChange(s.id); setOpen(false); }}>
                  <Check className={cn("mr-2 h-4 w-4", s.id === field.value ? "opacity-100" : "opacity-0")} /> {s.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// --- Main Form Component ---
export default function PostForm({ editingPost, onFormSubmit, onBack, isSubmitting, debugError }: PostFormProps) {
  const session = useSession();
  const posterFileInputRef = useRef<HTMLInputElement>(null);
  const [seriesList, setSeriesList] = useState<any[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [customContentTypes, setCustomContentTypes] = useState<string[]>([]);
  const { toast } = useToast();
  const [postStatus, setPostStatus] = useState<{ limit: number; count: number; remaining: number } | null>(null);

  const [activeStep, setActiveStep] = useState("details"); // 'details', 'description', 'visibility'
  const [isPending, startTransition] = useTransition();

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: editingPost?.title || '',
      description: editingPost?.description || '',
      posterUrl: editingPost?.posterUrl || '',
      year: editingPost?.year || undefined,
      duration: editingPost?.duration || '',
      genres: editingPost?.genres ? editingPost.genres.split(',') : [],
      directors: editingPost?.directors || '',
      mainCast: editingPost?.mainCast || '',
      imdbRating: editingPost?.imdbRating || undefined,
      rottenTomatoesRating: editingPost?.rottenTomatoesRating || undefined,
      googleRating: editingPost?.googleRating || undefined,
      mediaLinks: editingPost?.mediaLinks || [],
      type: (editingPost?.type as any) || 'MOVIE',
      seriesId: editingPost?.seriesId || undefined,
      orderInSeries: editingPost?.orderInSeries || undefined,
      visibility: (editingPost?.visibility as any) || 'PUBLIC',
      groupId: editingPost?.groupId || undefined,
      isLockedByDefault: editingPost?.isLockedByDefault || false,
      requiresExamToUnlock: editingPost?.requiresExamToUnlock || false,
      customContentLabel: editingPost?.type === 'OTHER'
        ? editingPost?.metaData?.find(m => m.key === 'contentTypeLabel')?.value
        : '',
    },
  });

  const { control, watch, setValue, trigger } = form;
  const posterUrlValue = watch('posterUrl');
  const visibility = watch('visibility');
  const customContentLabel = watch('customContentLabel');

  const { fields, append, remove } = useFieldArray({ control, name: 'mediaLinks' });

  useEffect(() => {
    async function fetchData() {
      try {
        const [seriesData, groupData, statusData, customTypesData] = await Promise.all([
          getSeries(),
          getGroupsForForm(),
          getPostCreationStatus(),
          getCustomContentTypes()
        ]);
        setSeriesList(seriesData);
        setGroups(groupData as Group[]);
        setPostStatus(statusData);
        setCustomContentTypes(customTypesData);
      } catch (error) {
        console.error("Failed to fetch initial form data:", error);
      }
    }
    fetchData();
  }, []);

  const handleCreateCustomType = (value: string) => {
    startTransition(async () => {
      try {
        const newTypes = await addCustomContentType(value);
        setCustomContentTypes(newTypes);
        setValue('type', 'OTHER');
        setValue('customContentLabel', value);
        toast({ title: "Custom Type Added", description: `Added "${value}"` });
      } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
      }
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        alert('File size exceeds 5MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setValue('posterUrl', reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (values: PostFormValues) => {
    const metaData: { key: string; value: string }[] = [];
    if (values.customContentLabel && values.type === 'OTHER') {
      metaData.push({ key: 'contentTypeLabel', value: values.customContentLabel });
    }
    const postData: PostFormData = {
      ...values,
      posterUrl: values.posterUrl || null,
      year: values.year || null,
      duration: values.duration || null,
      genres: values.genres || [],
      directors: values.directors || null,
      mainCast: values.mainCast || null,
      imdbRating: values.imdbRating || null,
      rottenTomatoesRating: values.rottenTomatoesRating || null,
      googleRating: values.googleRating || null,
      status: editingPost?.status || 'DRAFT',
      viewCount: editingPost?.viewCount || 0,
      seriesId: values.seriesId ?? null,
      orderInSeries: values.orderInSeries ?? null,
      groupId: values.visibility === 'GROUP_ONLY' ? (values.groupId ?? null) : null,
      publishedAt: editingPost?.publishedAt ?? null,
      metaData,
    };
    onFormSubmit(postData, editingPost?.id);
  };

  const nextStep = async () => {
    let valid = false;
    if (activeStep === 'details') valid = await trigger(['title', 'type', 'year', 'duration', 'imdbRating']);
    else if (activeStep === 'description') valid = await trigger(['description']);

    if (valid) {
      if (activeStep === 'details') setActiveStep('description');
      else if (activeStep === 'description') setActiveStep('visibility');
    }
  };

  const prevStep = () => {
    if (activeStep === 'description') setActiveStep('details');
    else if (activeStep === 'visibility') setActiveStep('description');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-4 w-full h-full">
      {/* Main Card Container - Flex Grow to fill available space */}
      <Card className="w-auto mx-4 md:mx-[50px] flex-grow flex flex-col bg-[#0f0f0f] border-white/10 shadow-2xl rounded-3xl overflow-hidden relative self-stretch">

        {/* Header: Title & Stepper */}
        <div className="flex-none p-6 border-b border-white/10 flex flex-col gap-6 bg-[#0f0f0f] z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">{editingPost ? 'Edit Post' : 'Create Post'}</h2>
            <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full hover:bg-white/10">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Stepper Component */}
          <div className="flex items-center justify-center w-full px-4 md:px-12">
            <StepIcon step="details" currentStep={activeStep} onClick={() => { }} label="Details" />
            <StepperLine active={activeStep !== 'details'} />
            <StepIcon step="description" currentStep={activeStep} onClick={() => { }} label="Description" />
            <StepperLine active={activeStep === 'visibility'} />
            <StepIcon step="visibility" currentStep={activeStep} onClick={() => { }} label="Finalize" />
          </div>
        </div>

        {/* Content Area: Scrollable */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="h-full">
              <div className="p-8 max-w-6xl mx-auto space-y-8 h-full">

                {/* STEP 1: Details (Title, Image, Type, Ratings, Cast - No Description) */}
                {activeStep === 'details' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 flex flex-col">
                    {/* Vertical Layout: Poster Top (Banner), then Fields */}
                    <div className="flex flex-col gap-8">

                      {/* Top Image Banner Section */}
                      <div className="w-full space-y-4">
                        <div className="relative w-full h-48 md:h-64 bg-black/40 rounded-3xl border border-white/10 overflow-hidden group shadow-xl">
                          {posterUrlValue ? (
                            <Image src={posterUrlValue} alt="Poster" fill className="object-cover" />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full w-full text-muted-foreground bg-white/5 space-y-2">
                              <ImageIcon className="w-12 h-12 opacity-20" />
                              <span className="text-sm font-medium opacity-50">Upload Banner / Poster</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer space-y-2" onClick={() => posterFileInputRef.current?.click()}>
                            <Upload className="w-8 h-8 text-white" />
                            <span className="text-white text-sm font-medium">Click to Upload</span>
                          </div>
                        </div>
                        <div className="flex gap-2 justify-center">
                          <Button type="button" variant="outline" size="sm" className="rounded-full border-white/10 hover:bg-white/10 h-8 text-xs" onClick={() => posterFileInputRef.current?.click()}>
                            Choose File
                          </Button>
                          <Input placeholder="Paste URL..." {...form.register('posterUrl')} className="bg-transparent border-white/10 rounded-full w-64 h-8 text-xs focus-visible:ring-0" />
                        </div>
                        <input type="file" ref={posterFileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                      </div>

                      {/* Fields Section */}
                      <div className="space-y-6">
                        <FormField
                          control={control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-lg font-semibold ml-1">Title</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Enter the main title of the content..."
                                  {...field}
                                  className="bg-black/20 border-white/10 text-xl font-bold rounded-2xl p-4 min-h-[80px] focus:border-blue-500/50 resize-y"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={control}
                            name="type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Type</FormLabel>
                                <ContentTypeSelector
                                  value={field.value}
                                  onChange={field.onChange}
                                  customTypes={customContentTypes}
                                  onCustomCreate={handleCreateCustomType}
                                  onCustomSelect={(label: string) => setValue('customContentLabel', label)}
                                  customLabel={customContentLabel}
                                  session={session}
                                />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={control}
                            name="seriesId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Series (Optional)</FormLabel>
                                <SeriesCombobox field={field} seriesList={seriesList} onSeriesCreated={(ns: any) => setSeriesList(prev => [...prev, ns])} />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Conditional Episode Input if Series Selected */}
                        {watch('seriesId') && (
                          <FormField
                            control={control}
                            name="orderInSeries"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-medium">Episode Number</FormLabel>
                                <Input type="number" {...field} value={field.value ?? ''} className="bg-black/20 border-white/10 rounded-xl h-12" placeholder="e.g. 1" />
                              </FormItem>
                            )}
                          />
                        )}

                        <div className="grid grid-cols-2 gap-6">
                          <FormField
                            control={control}
                            name="year"
                            render={({ field }) => (
                              <FormItem><FormLabel>Year</FormLabel><Input type="number" placeholder="2024" {...field} value={field.value ?? ''} className="bg-black/20 border-white/10 rounded-xl h-12" /></FormItem>
                            )}
                          />
                          <FormField
                            control={control}
                            name="duration"
                            render={({ field }) => (
                              <FormItem><FormLabel>Duration</FormLabel><Input placeholder="2h 15m" {...field} className="bg-black/20 border-white/10 rounded-xl h-12" /></FormItem>
                            )}
                          />
                        </div>

                        {/* Ratings Grid */}
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-4">
                          <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Ratings</h4>
                          <div className="grid grid-cols-3 gap-4">
                            <FormField
                              control={control}
                              name="imdbRating"
                              render={({ field }) => <FormItem><FormLabel className="text-xs">IMDb</FormLabel><Input type="number" step="0.1" {...field} value={field.value ?? ''} className="bg-black/20 border-white/10 rounded-lg" /></FormItem>}
                            />
                            <FormField
                              control={control}
                              name="rottenTomatoesRating"
                              render={({ field }) => <FormItem><FormLabel className="text-xs">Rotten T.</FormLabel><Input type="number" {...field} value={field.value ?? ''} className="bg-black/20 border-white/10 rounded-lg" /></FormItem>}
                            />
                            <FormField
                              control={control}
                              name="googleRating"
                              render={({ field }) => <FormItem><FormLabel className="text-xs">Google</FormLabel><Input type="number" {...field} value={field.value ?? ''} className="bg-black/20 border-white/10 rounded-lg" /></FormItem>}
                            />
                          </div>
                        </div>

                        {/* Cast & Crew Moved Here */}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={control}
                              name="directors"
                              render={({ field }) => (
                                <FormItem><FormLabel>Directors</FormLabel><Input placeholder="e.g. Christopher Nolan" {...field} className="bg-black/20 border-white/10 rounded-xl h-11" /></FormItem>
                              )}
                            />
                            <FormField
                              control={control}
                              name="mainCast"
                              render={({ field }) => (
                                <FormItem><FormLabel>Main Cast</FormLabel><Input placeholder="e.g. Cillian Murphy, Emily Blunt" {...field} className="bg-black/20 border-white/10 rounded-xl h-11" /></FormItem>
                              )}
                            />
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Description (Description ONLY) */}
                {activeStep === 'description' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 flex flex-col h-full gap-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold">Description</h3>
                      <p className="text-sm text-muted-foreground">Provide a detailed description of the content.</p>
                    </div>
                    <FormField
                      control={control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="flex-1 flex flex-col">
                          <FormControl>
                            <div className="flex-1 rounded-2xl border border-white/20 bg-black/20 overflow-hidden focus-within:border-blue-500 transition-colors min-h-[400px]">
                              <QuillEditor {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* STEP 3: Finalize (Visibility, Tags, Media) */}
                {activeStep === 'visibility' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 flex flex-col gap-8">
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">Finalize & Publish</h3>
                      <p className="text-muted-foreground">Set visibility, add tags, and manage accessibility.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Left Column: Visibility & Restrictions */}
                      <div className="space-y-6">
                        <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
                          <FormField
                            control={control}
                            name="visibility"
                            render={({ field }) => (
                              <FormItem className="space-y-4">
                                <div className={cn("flex items-start gap-4 p-4 rounded-xl cursor-pointer border hover:bg-white/5 transition-all text-left", field.value === 'PUBLIC' ? "border-primary bg-primary/5" : "border-transparent")} onClick={() => field.onChange('PUBLIC')}>
                                  <div className={cn("mt-1 w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center", field.value === 'PUBLIC' ? "border-primary" : "border-muted-foreground")}>
                                    {field.value === 'PUBLIC' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                  </div>
                                  <div>
                                    <p className="font-semibold block">Public</p>
                                    <p className="text-sm text-muted-foreground">Everyone can watch your video</p>
                                  </div>
                                </div>

                                <div className={cn("flex items-start gap-4 p-4 rounded-xl cursor-pointer border hover:bg-white/5 transition-all text-left", field.value === 'GROUP_ONLY' ? "border-primary bg-primary/5" : "border-transparent")} onClick={() => field.onChange('GROUP_ONLY')}>
                                  <div className={cn("mt-1 w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center", field.value === 'GROUP_ONLY' ? "border-primary" : "border-muted-foreground")}>
                                    {field.value === 'GROUP_ONLY' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                  </div>
                                  <div>
                                    <p className="font-semibold block">Group Only</p>
                                    <p className="text-sm text-muted-foreground">Only members of specific groups can watch</p>
                                  </div>
                                </div>
                              </FormItem>
                            )}
                          />
                          {visibility === 'GROUP_ONLY' && (
                            <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-2">
                              <FormField
                                control={control}
                                name="groupId"
                                render={({ field }) => (
                                  <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                                    <FormControl><SelectTrigger className="bg-black/20 border-white/10 h-12 rounded-xl"><SelectValue placeholder="Select Group" /></SelectTrigger></FormControl>
                                    <SelectContent>{groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
                                  </Select>
                                )}
                              />
                            </div>
                          )}
                        </div>

                        <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
                          <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Restrictions</h4>
                          <FormField
                            control={control}
                            name="isLockedByDefault"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between">
                                <div><FormLabel className="text-base font-normal">Lock Content</FormLabel><FormDescription>Requires premium unlock</FormDescription></div>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={control}
                            name="requiresExamToUnlock"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between">
                                <div><FormLabel className="text-base font-normal">Exam Required</FormLabel><FormDescription>Must pass exam first</FormDescription></div>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Right Column: Tags & Media */}
                      <div className="space-y-6">
                        {/* Genres/Tags */}
                        <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
                          <h4 className="font-semibold flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-400" /> Tags / Genres</h4>
                          <FormField
                            control={control}
                            name="genres"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <GenreInput value={field.value || []} onChange={field.onChange} placeholder="Add specific genres or tags..." />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Media Links */}
                        <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-6">
                          <div className="flex justify-between items-center">
                            <h4 className="font-semibold flex items-center gap-2"><Film className="w-5 h-5 text-purple-400" /> Media Links</h4>
                            <Button type="button" variant="outline" size="sm" className="rounded-full gap-2" onClick={() => append({ type: 'trailer', url: '' })}><Plus className="w-4 h-4" /> Add Link</Button>
                          </div>
                          <div className="space-y-4">
                            {fields.map((field, index) => (
                              <div key={field.id} className="flex gap-4 items-center p-3 rounded-xl border border-white/10 bg-black/20">
                                <FormField
                                  control={control}
                                  name={`mediaLinks.${index}.type`}
                                  render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl><SelectTrigger className="w-28 bg-transparent border-none text-xs"><SelectValue /></SelectTrigger></FormControl>
                                      <SelectContent><SelectItem value="trailer">Trailer</SelectItem><SelectItem value="image">Image</SelectItem></SelectContent>
                                    </Select>
                                  )}
                                />
                                <div className="h-6 w-[1px] bg-white/10" />
                                <FormField
                                  control={control}
                                  name={`mediaLinks.${index}.url`}
                                  render={({ field }) => (
                                    <Input placeholder="Paste URL..." {...field} className="flex-1 bg-transparent border-none focus-visible:ring-0 text-sm" />
                                  )}
                                />
                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="hover:text-red-400 h-8 w-8"><Trash2 className="w-4 h-4" /></Button>
                              </div>
                            ))}
                            {fields.length === 0 && <div className="text-center py-4 text-muted-foreground text-xs">No media links added yet.</div>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </form>
          </Form>
        </div>

        {/* Footer: Fixed Bottom Bar */}
        <div className="flex-none p-4 md:px-8 md:py-4 border-t border-white/10 bg-[#0f0f0f] z-10 flex items-center justify-between">
          <Button variant="ghost" onClick={prevStep} disabled={activeStep === 'details'} className="font-medium text-muted-foreground hover:text-white rounded-full">
            Back
          </Button>

          <div className="flex items-center gap-2">
            {activeStep === 'visibility' ? (
              <Button onClick={form.handleSubmit(handleSubmit)} disabled={isSubmitting} className="rounded-full px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (editingPost ? 'Save' : 'Publish')}
              </Button>
            ) : (
              <Button onClick={nextStep} className="rounded-full px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                Next
              </Button>
            )}
          </div>
        </div>

        {debugError && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
            <Alert variant="destructive" className="bg-red-950/90 border-red-900 text-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{debugError.message}</AlertDescription>
            </Alert>
          </div>
        )}

      </Card>
    </div>
  );
}
