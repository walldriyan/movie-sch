'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ReactPlayer from 'react-player/lazy';
import {
    Edit2, Save, Trash2, Video, Image as ImageIcon, Link as LinkIcon,
    AlertCircle, X, Loader2, Music, Upload, Plus, Play, Pause,
    SkipBack, SkipForward, Volume2, Mic2, Copy, RefreshCw, ListMusic
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { updatePromoData, AudioTrack } from '@/lib/actions/promo';
import { uploadPromoFile, getPromoFiles, deletePromoFile } from '@/lib/actions/upload-promo';
import { User } from '@prisma/client';
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MediaManager } from '@/components/media/media-manager';
import { getPlaylist } from '@/lib/actions/playlists';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FeaturedPromoProps {
    data: {
        active: boolean;
        type: 'video' | 'image' | 'audio';
        mediaUrl: string;
        title: string;
        description: string;
        linkUrl?: string;
        audioTracks?: AudioTrack[];
        playlistId?: string; // New: Link to DB playlist
    };
    currentUser?: User | null;
}

export function FeaturedPromo({ data, currentUser }: FeaturedPromoProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isOpen, setIsOpen] = useState(false);
    const isAdmin = currentUser?.role === 'SUPER_ADMIN';

    // Video Player State
    const [videoMode, setVideoMode] = useState(false); // If true, video plays with sound/controls and overlay is hidden
    const [hasMounted, setHasMounted] = useState(false);

    // New Media Manager State
    const [mediaManagerOpen, setMediaManagerOpen] = useState(false);

    // Playlist Data State
    const [dbPlaylist, setDbPlaylist] = useState<any>(null);

    // Initial Load of DB Playlist if exists
    useEffect(() => {
        setHasMounted(true);
        if (data.playlistId) {
            loadDbPlaylist(data.playlistId);
        } else {
            // Fallback for legacy data: set tracks from data.audioTracks if playlistId not present? 
            // Actually, we'll just prioritize dbPlaylist if present.
        }
    }, [data.playlistId]);

    const loadDbPlaylist = async (id: string) => {
        const p = await getPlaylist(id);
        if (p) {
            setDbPlaylist(p);
        }
    };

    // Audio Player State
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.8);
    const [played, setPlayed] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioPlayerRef = useRef<ReactPlayer>(null);
    const [isHoveringPlayer, setIsHoveringPlayer] = useState(false);

    // Form State
    const [formData, setFormData] = useState(data);
    const [uploading, setUploading] = useState(false);

    // Library State
    const [libraryFiles, setLibraryFiles] = useState<{ name: string, url: string, type: string }[]>([]);
    const [loadingFiles, setLoadingFiles] = useState(false);

    const loadLibrary = async () => {
        setLoadingFiles(true);
        const res = await getPromoFiles();
        if (res.success && res.files) {
            setLibraryFiles(res.files);
        }
        setLoadingFiles(false);
    };

    const handleDeleteFile = async (filename: string) => {
        if (!confirm("Permanently delete this file? This cannot be undone.")) return;

        const res = await deletePromoFile(filename);
        if (res.success) {
            toast.success("File deleted");
            loadLibrary(); // refresh
        } else {
            toast.error("Failed to delete");
        }
    };

    const handleCopyUrl = (url: string) => {
        navigator.clipboard.writeText(window.location.origin + url);
        toast.success("URL copied to clipboard!");
    };

    // Auto-load library when dialog opens
    useEffect(() => {
        if (isOpen) {
            setFormData(data); // Reset form to current data
            loadLibrary();
        }
    }, [isOpen, data]);


    const handleSubmit = async () => {
        startTransition(async () => {
            const res = await updatePromoData(formData);
            if (res.success) {
                toast.success("Promo section updated");
                setIsOpen(false);
                router.refresh();
            } else {
                toast.error(res.error || "Failed to update");
            }
        });
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to reset deeply?")) return;
        setFormData({
            active: false,
            type: 'image',
            mediaUrl: '',
            title: '',
            description: '',
            linkUrl: '',
            audioTracks: [],
            playlistId: undefined
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'media' | 'audioTrack') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const data = new FormData();
        data.append('file', file);

        const res = await uploadPromoFile(data);
        setUploading(false);

        if (res.success && res.url) {
            toast.success("File uploaded");
            setTimeout(loadLibrary, 500); // refresh lib

            if (target === 'media') {
                setFormData(prev => ({ ...prev, mediaUrl: res.url }));
            } else {
                // Add as new audio track
                setFormData(prev => ({
                    ...prev,
                    audioTracks: [...(prev.audioTracks || []), { title: res.name || 'New Track', url: res.url }]
                }));
            }
        } else {
            toast.error(res.error || "Upload failed");
        }
    };

    // Removed legacy removeTrack function as we use DB playlist now


    // Audio Controls
    const togglePlay = () => setIsPlaying(!isPlaying);
    const handleNext = () => {
        // Use dbPlaylist if available, else legacy audioTracks
        const tracks = dbPlaylist?.items || data.audioTracks || [];
        if (tracks.length === 0) return;

        if (currentTrackIndex < tracks.length - 1) {
            setCurrentTrackIndex(prev => prev + 1);
        } else {
            setCurrentTrackIndex(0); // loop back
        }
    };
    const handlePrev = () => {
        if (currentTrackIndex > 0) {
            setCurrentTrackIndex(prev => prev - 1);
        }
    };

    // Helper for YouTube ID
    const getYouTubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    // Image Error State
    const [imageError, setImageError] = useState(false);

    // Reset error when url changes
    useEffect(() => {
        setImageError(false);
    }, [data.mediaUrl]);

    const isGradientFallback = !data.active || (!data.mediaUrl && !data.title) || (data.type !== 'video' && imageError);
    // Determine active track from DB or Legacy
    const currentTracks = dbPlaylist?.items || data.audioTracks || [];
    const activeTrack = currentTracks[currentTrackIndex];

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
                            // Image or Audio Background
                            <div className="absolute inset-0 w-full h-full">
                                {data.mediaUrl && !imageError && (
                                    <Image
                                        src={data.mediaUrl}
                                        alt={data.title}
                                        fill
                                        className={cn(
                                            "object-cover transition-all duration-700",
                                            isPlaying ? "scale-105 blur-sm brightness-50" : "scale-100 brightness-75"
                                        )}
                                        onError={() => setImageError(true)}
                                    />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                            </div>
                        )}
                    </>
                )}

                {/* Content Overlay - Hidden in Active Video Mode */}
                <div className={cn(
                    "absolute inset-0 flex flex-col justify-end p-6 md:p-12 transition-opacity duration-300",
                    videoMode ? "opacity-0 pointer-events-none" : "opacity-100"
                )}>
                    {data.type === 'audio' && activeTrack ? (
                        // Spotify-Style Audio Player UI
                        <div className="w-full md:w-[450px] self-end md:self-auto space-y-4">
                            <div className="flex gap-4 items-end">
                                {/* Cover Art (Spinning) */}
                                <div className={cn(
                                    "relative w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden shadow-2xl border border-white/10 shrink-0",
                                    isPlaying && "animate-pulse" // Could add a spin animation class here if defined
                                )}>
                                    {data.mediaUrl && !imageError ? (
                                        <Image
                                            src={data.mediaUrl}
                                            alt="Cover"
                                            fill
                                            className="object-cover"
                                            onError={() => setImageError(true)}
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-pink-900 flex items-center justify-center"><Music className="w-10 h-10 text-white/50" /></div>
                                    )}
                                </div>

                                <div className="flex-1 pb-2 min-w-0">
                                    <h3 className="text-2xl font-bold text-white truncate leading-tight drop-shadow-md">{activeTrack.title}</h3>
                                    <p className="text-white/70 text-sm truncate">{data.title}</p>
                                </div>
                            </div>

                            {/* Player Controls */}
                            <div className="bg-black/60 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-2xl">
                                {hasMounted && (
                                    <ReactPlayer
                                        ref={audioPlayerRef}
                                        url={activeTrack.url}
                                        playing={isPlaying}
                                        volume={volume}
                                        width="0"
                                        height="0"
                                        onProgress={(state) => {
                                            setPlayed(state.played);
                                        }}
                                        onDuration={setDuration}
                                        onEnded={handleNext}
                                        style={{ display: 'none' }}
                                    />
                                )}

                                {/* Progress Bar */}
                                <div
                                    className="w-full bg-white/10 h-1.5 rounded-full mb-4 cursor-pointer group"
                                    onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const x = e.clientX - rect.left;
                                        const newPlayed = x / rect.width;
                                        setPlayed(newPlayed);
                                        audioPlayerRef.current?.seekTo(newPlayed);
                                    }}
                                >
                                    <div
                                        className="bg-green-500 h-full rounded-full relative group-hover:bg-green-400 transition-colors"
                                        style={{ width: `${played * 100}%` }}
                                    >
                                        <div className="absolute -right-1.5 -top-1 w-3.5 h-3.5 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-md transition-opacity" />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Button variant="ghost" size="icon" onClick={handlePrev} className="text-white/70 hover:text-white hover:bg-white/10 rounded-full h-10 w-10">
                                            <SkipBack className="w-5 h-5 fill-current" />
                                        </Button>

                                        <Button
                                            size="icon"
                                            className="h-12 w-12 rounded-full bg-white text-black hover:bg-gray-200 hover:scale-105 transition-all shadow-lg"
                                            onClick={togglePlay}
                                        >
                                            {isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black ml-1" />}
                                        </Button>

                                        <Button variant="ghost" size="icon" onClick={handleNext} className="text-white/70 hover:text-white hover:bg-white/10 rounded-full h-10 w-10">
                                            <SkipForward className="w-5 h-5 fill-current" />
                                        </Button>
                                    </div>

                                    {/* Volume */}
                                    <div className="flex items-center gap-2 group/vol w-24 md:w-32">
                                        <Volume2 className="w-4 h-4 text-white/50" />
                                        <Slider
                                            value={[volume * 100]}
                                            onValueChange={(val) => setVolume(val[0] / 100)}
                                            max={100}
                                            step={1}
                                            className="cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Playlist (Scrollable) */}
                            {currentTracks.length > 1 && (
                                <ScrollArea className="h-[120px] w-full rounded-xl bg-black/40 backdrop-blur-md border border-white/5 p-2">
                                    {currentTracks.map((track: any, i: number) => (
                                        <div
                                            key={i}
                                            onClick={() => { setCurrentTrackIndex(i); setIsPlaying(true); }}
                                            className={cn(
                                                "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors group",
                                                currentTrackIndex === i ? "bg-white/10" : "hover:bg-white/5"
                                            )}
                                        >
                                            <div className="w-4 flex justify-center">
                                                {currentTrackIndex === i && isPlaying ? (
                                                    <div className="flex gap-0.5 items-end h-3">
                                                        <div className="w-0.5 bg-green-500 h-full animate-[bounce_1s_infinite]" />
                                                        <div className="w-0.5 bg-green-500 h-2/3 animate-[bounce_1.2s_infinite]" />
                                                        <div className="w-0.5 bg-green-500 h-full animate-[bounce_0.8s_infinite]" />
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-white/50 group-hover:text-white">{i + 1}</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm truncate text-white/90">
                                                    {track.title}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </ScrollArea>
                            )}
                        </div>
                    ) : (
                        // Default Text Content (Video/Image)
                        <div className="max-w-2xl space-y-4 md:space-y-6">
                            <div className="space-y-2">
                                <h2 className="text-3xl md:text-5xl font-black text-white leading-tight drop-shadow-lg tracking-tight capitalize">
                                    {data.title || "Featured Promo"}
                                </h2>
                                <p className="text-lg md:text-xl text-gray-200 font-medium drop-shadow-md line-clamp-3 md:line-clamp-none max-w-xl">
                                    {data.description || "Exciting content coming soon."}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-4 pt-2">
                                {data.type === 'video' ? (
                                    <Button
                                        size="lg"
                                        className="bg-white text-black hover:bg-gray-200 rounded-full px-8 text-base font-bold shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-transform hover:scale-105"
                                        onClick={() => setVideoMode(true)}
                                    >
                                        <Play className="w-5 h-5 mr-2 fill-black" />
                                        Watch Video
                                    </Button>
                                ) : data.linkUrl ? (
                                    <Button
                                        asChild
                                        size="lg"
                                        className="bg-white text-black hover:bg-gray-200 rounded-full px-8 text-base font-bold shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-transform hover:scale-105"
                                    >
                                        <a href={data.linkUrl} target="_blank" rel="noopener noreferrer">
                                            Visit Link <LinkIcon className="w-4 h-4 ml-2" />
                                        </a>
                                    </Button>
                                ) : null}
                            </div>
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

                                <Tabs defaultValue="edit" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2 bg-white/5">
                                        <TabsTrigger value="edit">Edit Content</TabsTrigger>
                                        <TabsTrigger value="library">Media Library</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="edit" className="space-y-4 mt-4">
                                        {/* Existing Form Content */}
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
                                                            onChange={(e) => {
                                                                handleFileUpload(e, 'media');
                                                                setTimeout(loadLibrary, 1000); // refresh lib after upload
                                                            }}
                                                            disabled={uploading}
                                                        />
                                                        <Button variant="outline" size="icon" disabled={uploading}>
                                                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Audio Track Manager (DB Based) */}
                                            {formData.type === 'audio' && (
                                                <div className="border border-white/10 rounded-lg p-4 space-y-4 bg-white/5">
                                                    <Label className="text-pink-400">Audio Source</Label>
                                                    <div className="flex flex-col gap-3">
                                                        <p className="text-sm text-white/60">
                                                            Currently Selected: <span className="text-white font-bold">{dbPlaylist?.name || (formData.playlistId ? "Loading..." : "None")}</span>
                                                        </p>

                                                        {/* Open Media Manager */}
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="default"
                                                                className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                                                                onClick={() => setMediaManagerOpen(true)}
                                                            >
                                                                <ListMusic className="w-4 h-4 mr-2" />
                                                                Select / Manage Playlist
                                                            </Button>
                                                        </div>

                                                        {/* Media Manager Dialog */}
                                                        <MediaManager
                                                            isOpen={mediaManagerOpen}
                                                            onOpenChange={setMediaManagerOpen}
                                                            defaultPlaylistId={formData.playlistId}
                                                            onSelectPlaylist={(id) => {
                                                                setFormData(prev => ({ ...prev, playlistId: id }));
                                                                loadDbPlaylist(id); // Reload locally
                                                            }}
                                                        />
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
                                    </TabsContent>

                                    <TabsContent value="library" className="mt-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-semibold text-sm text-white/70">Server Files (public/uploads/promo)</h3>
                                            <Button size="sm" variant="ghost" onClick={loadLibrary} disabled={loadingFiles}>
                                                <RefreshCw className={cn("w-4 h-4", loadingFiles && "animate-spin")} />
                                            </Button>
                                        </div>

                                        <ScrollArea className="h-[400px] pr-4">
                                            {libraryFiles.length === 0 ? (
                                                <p className="text-center text-white/30 py-10 text-sm">No files found.</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {libraryFiles.map((file, i) => (
                                                        <div key={i} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg border border-white/5 group hover:bg-white/10 transition-colors">
                                                            <div className="w-10 h-10 shrink-0 rounded bg-black/50 overflow-hidden flex items-center justify-center">
                                                                {file.type === 'image' ? (
                                                                    <Image src={file.url} alt={file.name} width={40} height={40} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <Music className="w-5 h-5 text-pink-400" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium truncate text-white/90" title={file.name}>
                                                                    {file.name}
                                                                </p>
                                                                <p className="text-xs text-white/40 uppercase font-mono">{file.type}</p>
                                                            </div>
                                                            <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                                {/* Add To Playlist (Only for Audio) */}
                                                                {file.type !== 'image' && (
                                                                    <Button
                                                                        variant="ghost" size="icon"
                                                                        className="h-8 w-8 text-green-400 hover:text-green-300 hover:bg-green-900/20"
                                                                        onClick={() => {
                                                                            setFormData(prev => ({
                                                                                ...prev,
                                                                                audioTracks: [...(prev.audioTracks || []), { title: file.name.replace(/\.[^/.]+$/, ""), url: file.url }]
                                                                            }));
                                                                            toast.success("Added to playlist");
                                                                        }}
                                                                        title="Add to Playlist"
                                                                    >
                                                                        <Plus className="w-3 h-3" />
                                                                    </Button>
                                                                )}
                                                                <Button
                                                                    variant="ghost" size="icon"
                                                                    className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                                                                    onClick={() => handleCopyUrl(file.url)}
                                                                    title="Copy URL"
                                                                >
                                                                    <Copy className="w-3 h-3" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost" size="icon"
                                                                    className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                                                    onClick={() => handleDeleteFile(file.name)}
                                                                    title="Delete Permanently"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </ScrollArea>
                                    </TabsContent>
                                </Tabs>

                                <div className="mt-4 flex justify-between sm:justify-between items-center w-full pt-4 border-t border-white/10">
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
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </div>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mt-12" />
        </section>
    );
}
