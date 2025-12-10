'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ReactPlayer from 'react-player/lazy';
import {
    Edit2, Save, Trash2, Video, Image as ImageIcon, Link as LinkIcon,
    AlertCircle, X, Loader2, Music, Upload, Plus, Play, Pause,
    SkipBack, SkipForward, Volume2, Mic2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { updatePromoData, PromoData } from '@/lib/actions/promo';
import { uploadPromoFile } from '@/lib/actions/upload-promo';
import { cn } from '@/lib/utils';
import type { User } from '@prisma/client';

interface FeaturedPromoProps {
    data: PromoData;
    currentUser: User | null;
}

export default function FeaturedPromo({ data, currentUser }: FeaturedPromoProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isOpen, setIsOpen] = useState(false);
    const isAdmin = currentUser?.role === 'SUPER_ADMIN';

    const [videoMode, setVideoMode] = useState(false); // If true, video plays with sound/controls and overlay is hidden
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    // Audio Player State
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Form state
    const [formData, setFormData] = useState<PromoData>(data);
    const [uploading, setUploading] = useState(false);

    // Update form when data prop changes
    const handleSubmit = async () => {
        startTransition(async () => {
            const res = await updatePromoData(formData);
            if (res.success) {
                toast.success("Promo section updated successfully");
                setIsOpen(false);
                router.refresh();
            } else {
                toast.error("Failed to update promo section");
            }
        });
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to clear/reset this section?")) return;
        const emptyData: PromoData = {
            active: false,
            type: 'image',
            mediaUrl: '',
            title: '',
            description: '',
            linkUrl: '',
            audioTracks: []
        };
        startTransition(async () => {
            const res = await updatePromoData(emptyData);
            if (res.success) {
                toast.success("Promo section cleared");
                setFormData(emptyData);
                router.refresh();
            }
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'media' | 'audioTrack') => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        const file = files[0];
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        try {
            const res = await uploadPromoFile(uploadFormData);
            if (res.success && res.url) {
                if (type === 'media') {
                    setFormData(prev => ({ ...prev, mediaUrl: res.url! }));
                    toast.success("Image uploaded!");
                } else if (type === 'audioTrack') {
                    setFormData(prev => ({
                        ...prev,
                        audioTracks: [...(prev.audioTracks || []), { title: res.name || 'Unknown Track', url: res.url! }]
                    }));
                    toast.success("Track added!");
                }
            } else {
                toast.error(res.error || "Upload failed");
            }
        } catch (error) {
            toast.error("Error uploading file");
        } finally {
            setUploading(false);
        }
    };

    const removeTrack = (index: number) => {
        setFormData(prev => ({
            ...prev,
            audioTracks: prev.audioTracks?.filter((_, i) => i !== index) || []
        }));
    };

    // Audio Player Controls
    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) audioRef.current.pause();
            else audioRef.current.play();
            setIsPlaying(!isPlaying);
        }
    };

    const playTrack = (index: number) => {
        setCurrentTrackIndex(index);
        setIsPlaying(true);
    };

    const nextTrack = () => {
        if (!data.audioTracks) return;
        setCurrentTrackIndex((prev) => (prev + 1) % data.audioTracks!.length);
    };

    const prevTrack = () => {
        if (!data.audioTracks) return;
        setCurrentTrackIndex((prev) => (prev - 1 + data.audioTracks!.length) % data.audioTracks!.length);
    };

    const isGradientFallback = !data.active || (!data.mediaUrl && !data.title);
    const activeTrack = data.audioTracks?.[currentTrackIndex];

    const getYouTubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    return (
        <section className="container max-w-7xl mx-auto px-4 md:px-8 mb-24 relative group/promo">
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/20">
                    <Mic2 className="w-6 h-6 text-pink-400" />
                </div>
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Featured Content</h2>
                    <p className="text-muted-foreground text-sm">Highlights, Music & News</p>
                </div>
            </div>

            <div className={cn(
                "relative w-full rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 border border-white/5",
                "aspect-video md:aspect-[21/9] lg:aspect-[24/9] max-h-[500px]",
                isGradientFallback ? "bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900" : "bg-[#0a0a0a]"
            )}>

                {/* Media Content */}
                {!isGradientFallback && (
                    <>
                        {data.type === 'video' ? (
                            <div className={cn("absolute inset-0 w-full h-full transition-all duration-500", videoMode ? "z-30" : "z-0")}>
                                {/* Active Video Mode: Raw Iframe for maximum compatibility */}
                                {videoMode && hasMounted && (
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={`https://www.youtube.com/embed/${getYouTubeId(data.mediaUrl)}?autoplay=1&controls=1&rel=0&modestbranding=1&iv_load_policy=3`}
                                        title="YouTube video player"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                        className="w-full h-full border-0"
                                    />
                                )}

                                {/* Background Video Mode: ReactPlayer for loop/mute */}
                                {!videoMode && hasMounted && (
                                    <ReactPlayer
                                        url={data.mediaUrl}
                                        width="100%"
                                        height="100%"
                                        playing={true}
                                        muted={true}
                                        loop={true}
                                        controls={false}
                                        style={{ pointerEvents: 'none' }}
                                        config={{
                                            youtube: {
                                                playerVars: { showinfo: 0, controls: 0, modestbranding: 1, rel: 0 }
                                            }
                                        }}
                                    />
                                )}

                                {/* Background Overlay - Only visible when NOT in video mode */}
                                {!videoMode && <div className="absolute inset-0 bg-black/40 pointer-events-none" />}

                                {/* Close Video Button (When in Video Mode) */}
                                {videoMode && (
                                    <Button
                                        size="icon"
                                        variant="secondary"
                                        className="absolute top-4 right-4 z-50 bg-black/60 hover:bg-black/80 text-white rounded-full"
                                        onClick={() => setVideoMode(false)}
                                    >
                                        <X className="w-5 h-5" />
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="relative w-full h-full">
                                {data.mediaUrl && (
                                    <Image
                                        src={data.mediaUrl}
                                        alt={data.title}
                                        fill
                                        className={cn(
                                            "object-cover transition-transform duration-700",
                                            data.type === 'audio' ? "scale-105 blur-sm opacity-50" : "scale-100"
                                        )}
                                    />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
                            </div>
                        )}
                    </>
                )}

                {/* Content Overlay - Hidden when Video Mode is active */}
                <div className={cn(
                    "absolute inset-0 flex flex-col md:flex-row items-center md:justify-between px-8 md:px-12 py-8 z-20 transition-opacity duration-300",
                    videoMode ? "opacity-0 pointer-events-none" : "opacity-100"
                )}>

                    {/* Left Side: Text Info */}
                    <div className="flex-1 space-y-4 max-w-2xl text-center md:text-left pt-8 md:pt-0 pointer-events-none">
                        <div className="pointer-events-auto">
                            {data.title ? (
                                <h2 className="text-3xl md:text-5xl font-bold text-white drop-shadow-xl leading-tight">
                                    {data.title[0].toUpperCase() + data.title.slice(1)}
                                </h2>
                            ) : (
                                isGradientFallback && <h2 className="text-3xl md:text-4xl font-bold text-white/50">Featured</h2>
                            )}

                            {data.description && (
                                <p className="text-lg md:text-xl text-white/80 drop-shadow-md max-w-xl leading-relaxed mt-4 line-clamp-3">
                                    {data.description}
                                </p>
                            )}

                            {/* CTAs */}
                            <div className="pt-6 flex gap-4 justify-center md:justify-start">
                                {/* If Video: Watch Button */}
                                {data.type === 'video' && (
                                    <Button
                                        className="rounded-full bg-white text-black hover:bg-white/90 font-semibold px-8 h-12 shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all hover:scale-105 gap-2"
                                        onClick={() => setVideoMode(true)}
                                    >
                                        <Play className="w-4 h-4 fill-current" />
                                        Watch Video
                                    </Button>
                                )}

                                {/* External Link */}
                                {data.linkUrl && (
                                    <Button
                                        variant={data.type === 'video' ? "outline" : "default"}
                                        className={cn(
                                            "rounded-full font-semibold px-8 h-12 transition-all hover:scale-105",
                                            data.type === 'video' ? "border-white text-white hover:bg-white/10" : "bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                                        )}
                                        onClick={() => window.open(data.linkUrl, '_blank')}
                                    >
                                        {data.type === 'video' ? 'Details' : 'Learn More'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Spotify-Style Audio Player */}
                    {data.type === 'audio' && data.audioTracks && data.audioTracks.length > 0 && activeTrack && (
                        <div className="w-full md:w-[380px] mt-8 md:mt-0 bg-black/80 backdrop-blur-md border border-white/10 rounded-xl p-0 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-right-4 duration-700 flex flex-col h-[350px]">

                            {/* Current Track Info & Controls */}
                            <div className="p-6 pb-4 bg-gradient-to-b from-white/10 to-transparent">
                                <div className="flex items-end gap-4 mb-4">
                                    {/* Album Art Placeholder or from MediaUrl */}
                                    <div className="w-24 h-24 rounded shadow-lg bg-neutral-800 flex items-center justify-center shrink-0 overflow-hidden relative group">
                                        {data.mediaUrl ? (
                                            <Image src={data.mediaUrl} alt="Cover" fill className={cn("object-cover", isPlaying && "animate-[spin_10s_linear_infinite]")} />
                                        ) : (
                                            <Music className="w-10 h-10 text-white/50" />
                                        )}
                                    </div>
                                    <div className="overflow-hidden pb-1 min-w-0">
                                        <p className="text-xs text-green-400 font-bold tracking-wider mb-1">PLAYLIST</p>
                                        <h4 className="text-white font-bold text-lg truncate leading-tight">{activeTrack.title}</h4>
                                        <p className="text-white/60 text-sm truncate">{data.title || 'Featured Audio'}</p>
                                    </div>
                                </div>

                                {/* Progress Bar (Fake for now or could link to currentTime if exposed) */}
                                <div className="w-full h-1 bg-white/20 rounded-full mb-4 overflow-hidden">
                                    <div className={cn("h-full bg-green-500 rounded-full w-1/3", isPlaying && "animate-pulse")} />
                                </div>

                                {/* Main Controls */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <button onClick={prevTrack} className="text-white/70 hover:text-white transition-colors"><SkipBack className="w-6 h-6" /></button>
                                        <button
                                            onClick={togglePlay}
                                            className="w-12 h-12 rounded-full bg-green-500 text-black flex items-center justify-center hover:scale-105 transition-transform"
                                        >
                                            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                                        </button>
                                        <button onClick={nextTrack} className="text-white/70 hover:text-white transition-colors"><SkipForward className="w-6 h-6" /></button>
                                    </div>
                                    {/* Volume */}
                                    <div className="flex text-white/50 hover:text-white gap-2 items-center group/vol">
                                        <Volume2 className="w-5 h-5" />
                                        <div className="w-20 opacity-0 group-hover/vol:opacity-100 transition-opacity">
                                            <Slider defaultValue={[0.5]} max={1} step={0.01} onValueChange={(val) => {
                                                setVolume(val[0]);
                                                if (audioRef.current) audioRef.current.volume = val[0];
                                            }} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Playlist Scroll Area */}
                            <div className="flex-1 bg-neutral-900/50">
                                <ScrollArea className="h-full">
                                    <div className="p-2 space-y-0.5">
                                        {data.audioTracks.map((track, i) => (
                                            <button
                                                key={i}
                                                onClick={() => playTrack(i)}
                                                className={cn(
                                                    "w-full flex items-center gap-3 p-3 rounded-md text-left transition-colors group",
                                                    currentTrackIndex === i ? "bg-white/10" : "hover:bg-white/5"
                                                )}
                                            >
                                                {currentTrackIndex === i && isPlaying ? (
                                                    <div className="w-4 flex h-3 items-end gap-0.5"><span className="w-0.5 h-full bg-green-500 animate-pulse" /><span className="w-0.5 h-1/2 bg-green-500 animate-pulse" /><span className="w-0.5 h-3/4 bg-green-500 animate-pulse" /></div>
                                                ) : (
                                                    <span className="text-xs font-mono text-white/40 w-4 group-hover:hidden">{i + 1}</span>
                                                )}
                                                {currentTrackIndex !== i && (
                                                    <Play className="w-3 h-3 text-white hidden group-hover:block" />
                                                )}

                                                <div className="flex-1 min-w-0">
                                                    <p className={cn("text-sm truncate", currentTrackIndex === i ? "text-green-400 font-medium" : "text-white/90")}>{track.title}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>

                            <audio
                                ref={audioRef}
                                src={activeTrack.url}
                                autoPlay={isPlaying}
                                onEnded={nextTrack}
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                                className="hidden"
                            />
                        </div>
                    )}
                </div>

                {/* Edit Controls (Admin Only) */}
                {isAdmin && (
                    <div className="absolute top-4 right-4 z-50 opacity-0 group-hover/promo:opacity-100 transition-opacity duration-300 flex gap-2">
                        <Dialog open={isOpen} onOpenChange={setIsOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="secondary" className="backdrop-blur-md bg-black/50 text-white hover:bg-black/70 border border-white/10">
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Edit Section
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl bg-[#0a0a0a] border-white/10 text-white max-h-[85vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Edit Featured Layout</DialogTitle>
                                    <DialogDescription>
                                        Configure the large featured section above the footer.
                                    </DialogDescription>
                                </DialogHeader>

                                {/* Settings Form */}
                                <div className="grid gap-6 py-4">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="active"
                                            checked={formData.active}
                                            onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                                        />
                                        <Label htmlFor="active">Show Content</Label>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Type</Label>
                                            <Select
                                                value={formData.type || 'image'}
                                                onValueChange={(val: any) => setFormData({ ...formData, type: val })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent className="z-[99999] bg-[#1a1a1a] border-white/10">
                                                    <SelectItem value="video">Video (YouTube)</SelectItem>
                                                    <SelectItem value="image">Image</SelectItem>
                                                    <SelectItem value="audio">Audio / Music</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Media URL Input + Upload */}
                                    <div className="grid gap-2">
                                        <Label>
                                            {formData.type === 'audio' ? 'Cover Image URL' : 'Media URL (Image or YouTube)'}
                                        </Label>
                                        <div className="flex gap-2">
                                            <Input
                                                value={formData.mediaUrl}
                                                onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                                                placeholder={formData.type === 'video' ? 'https://youtube.com/...' : 'https://...'}
                                            />
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    className="absolute inset-0 opacity-0 cursor-pointer w-full"
                                                    accept="image/*"
                                                    onChange={(e) => handleFileUpload(e, 'media')}
                                                    disabled={uploading}
                                                />
                                                <Button variant="outline" size="icon" disabled={uploading}>
                                                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Audio Track Manager */}
                                    {formData.type === 'audio' && (
                                        <div className="border border-white/10 rounded-lg p-4 space-y-4 bg-white/5">
                                            <Label className="text-pink-400">Audio Playlist</Label>

                                            {/* Upload New Track */}
                                            <div className="flex gap-2 items-center">
                                                <div className="relative flex-1">
                                                    <Button variant="secondary" className="w-full relative overflow-hidden" disabled={uploading}>
                                                        {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                                        Upload MP3 / Audio
                                                        <input
                                                            type="file"
                                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                                            accept="audio/*"
                                                            onChange={(e) => handleFileUpload(e, 'audioTrack')}
                                                        />
                                                    </Button>
                                                </div>
                                                <span className="text-xs text-muted-foreground">or add URL manually below</span>
                                            </div>

                                            {/* Track List */}
                                            <div className="space-y-2 mt-2">
                                                {formData.audioTracks?.map((track, i) => (
                                                    <div key={i} className="flex items-center gap-2 bg-black/20 p-2 rounded border border-white/5">
                                                        <Music className="w-4 h-4 text-white/50" />
                                                        <div className="flex-1 grid grid-cols-2 gap-2">
                                                            <Input
                                                                value={track.title}
                                                                onChange={(e) => {
                                                                    const newTracks = [...(formData.audioTracks || [])];
                                                                    newTracks[i].title = e.target.value;
                                                                    setFormData({ ...formData, audioTracks: newTracks });
                                                                }}
                                                                placeholder="Title"
                                                                className="h-8 text-xs bg-transparent"
                                                            />
                                                            <Input
                                                                value={track.url}
                                                                onChange={(e) => {
                                                                    const newTracks = [...(formData.audioTracks || [])];
                                                                    newTracks[i].url = e.target.value;
                                                                    setFormData({ ...formData, audioTracks: newTracks });
                                                                }}
                                                                placeholder="URL"
                                                                className="h-8 text-xs bg-transparent"
                                                            />
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-400 hover:text-red-300"
                                                            onClick={() => removeTrack(i)}
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid gap-2">
                                        <Label>Title</Label>
                                        <Input
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Description</Label>
                                        <Textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows={3}
                                        />
                                    </div>

                                    {formData.type !== 'audio' && (
                                        <div className="grid gap-2">
                                            <Label>Link URL</Label>
                                            <Input
                                                value={formData.linkUrl || ''}
                                                onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                                            />
                                        </div>
                                    )}
                                </div>

                                <DialogFooter className="flex justify-between sm:justify-between items-center w-full">
                                    <Button variant="ghost" onClick={handleDelete} className="text-red-400 hover:text-red-300 hover:bg-red-900/20">
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Reset to Default
                                    </Button>
                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                                        <Button onClick={handleSubmit} disabled={isPending}>
                                            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                            Save Changes
                                        </Button>
                                    </div>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </div>
        </section>
    );
}
