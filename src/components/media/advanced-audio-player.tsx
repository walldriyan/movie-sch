'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import ReactPlayer from 'react-player/lazy';
import {
    Play, Pause, SkipForward, SkipBack, ListMusic, Volume2,
    X, Plus, Trash2, Edit2, Save, Music, ExternalLink, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from 'next/image';
import { MediaManager } from './media-manager';

// Server Actions
import {
    getActivePlaylist,
    getPlaylists,
    createPlaylist,
    toggleActivePlaylist,
    addPlaylistItem,
    deletePlaylistItem
} from '@/lib/actions/playlists';
import { toast } from 'sonner';
import { uploadMedia } from '@/lib/actions/upload-media';
import { Upload, FileAudio } from 'lucide-react'; // Added icons

interface AdvancedAudioPlayerProps {
    className?: string;
    canEdit?: boolean; // If user is admin
}

export function AdvancedAudioPlayer({ className, canEdit = false }: AdvancedAudioPlayerProps) {
    // Player State
    const [playlist, setPlaylist] = useState<any>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.8);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isExpanded, setIsExpanded] = useState(true); // Start expanded
    const [isVisible, setIsVisible] = useState(true);

    const playerRef = useRef<ReactPlayer>(null);
    const [hasMounted, setHasMounted] = useState(false);

    // Admin State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [newPlaylistName, setNewPlaylistName] = useState("");
    const [bgImage, setBgImage] = useState<string | null>(null);

    // Initial Load
    useEffect(() => {
        setHasMounted(true);
        loadActivePlaylist();
    }, []);

    const loadActivePlaylist = async () => {
        try {
            const active = await getActivePlaylist();
            if (active) {
                setPlaylist(active);
                // If items exist, start ready
            }
        } catch (e) {
            console.error("Failed to load playlist", e);
        }
    };

    // Auto-play next
    const handleNext = () => {
        if (!playlist?.items?.length) return;
        if (currentIndex < playlist.items.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setCurrentIndex(0); // Loop
            setIsPlaying(false); // Stop after loop? Or continue? Let's continue
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
    };

    const currentTrack = playlist?.items?.[currentIndex];

    // Admin Functions
    const loadAllPlaylists = async () => {
        const res = await getPlaylists();
        setPlaylists(res);
    };

    const handleCreatePlaylist = async () => {
        if (!newPlaylistName) return;
        await createPlaylist(newPlaylistName);
        toast.success("Playlist Created");
        setNewPlaylistName("");
        loadAllPlaylists();
    };

    const handleSetActive = async (id: string) => {
        await toggleActivePlaylist(id);
        toast.success("Active Playlist Updated");
        loadAllPlaylists();
        loadActivePlaylist(); // Refresh player
    };

    // Item Management
    const [newItemTitle, setNewItemTitle] = useState("");
    const [newItemUrl, setNewItemUrl] = useState("");
    const [isAddingItem, startTransition] = useTransition();

    const handleAddItem = async () => {
        if (!newItemUrl || !newItemTitle) return;
        startTransition(async () => {
            const type = newItemUrl.includes('youtu') ? 'YOUTUBE' : 'MP3';
            await addPlaylistItem(playlist.id, {
                title: newItemTitle,
                url: newItemUrl,
                type
            });
            toast.success("Track Added");
            setNewItemUrl("");
            setNewItemTitle("");
            loadActivePlaylist();
        });
    };

    const handleDeleteItem = async (itemId: string) => {
        await deletePlaylistItem(itemId);
        toast.success("Track Removed");
        loadActivePlaylist();
    };

    if (!playlist || !currentTrack) {
        if (canEdit) {
            return (
                <div className={cn("inline-flex", className)}>
                    <Button variant="outline" size="sm" onClick={() => { setIsEditOpen(true); }} className="bg-black/50 backdrop-blur-md text-white border-white/10">
                        <Plus className="w-4 h-4 mr-2" />
                        Setup Music Player
                    </Button>
                    <MediaManager
                        isOpen={isEditOpen}
                        onOpenChange={setIsEditOpen}
                        enableActiveToggle={true} // Allow setting active for hero
                    />
                </div>
            );
        }
        return null;
    }

    return (
        <div className={cn("relative z-20 pointer-events-auto", className)}>

            {/* Main Player Card */}
            {isVisible && (
                <div className={cn(
                    "bg-black/40 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl transition-all duration-500 ease-spring",
                    isExpanded ? "w-[350px] rounded-3xl" : "w-[300px] h-[80px] rounded-full flex items-center pr-4"
                )}>
                    {hasMounted && (
                        <ReactPlayer
                            ref={playerRef}
                            url={currentTrack.url}
                            playing={isPlaying}
                            volume={volume}
                            width="0"
                            height="0"
                            onProgress={(state) => setProgress(state.played)}
                            onDuration={setDuration}
                            onEnded={handleNext}
                            style={{ display: 'none' }}
                        />
                    )}

                    {/* Minimize/Close Controls (Hidden in Mini Mode) */}
                    {isExpanded && (
                        <div className="absolute top-3 right-3 flex gap-2 z-10">
                            {canEdit && (
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-white/50 hover:text-white" onClick={() => { setIsEditOpen(true); loadAllPlaylists(); }}>
                                    <Edit2 className="w-3 h-3" />
                                </Button>
                            )}
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-white/50 hover:text-white" onClick={() => setIsExpanded(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    )}

                    {/* Expanded View */}
                    {isExpanded ? (
                        <div className="p-6 pt-8">
                            {/* Track Info */}
                            <div className="flex gap-4 items-center mb-6">
                                <div className={cn(
                                    "w-16 h-16 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg overflow-hidden relative",
                                    isPlaying && !currentTrack.image && "animate-pulse"
                                )}>
                                    {currentTrack.image ? (
                                        <Image src={currentTrack.image} alt={currentTrack.title} fill className="object-cover" />
                                    ) : (
                                        <Music className="w-8 h-8 text-white" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-white font-bold truncate leading-tight">{currentTrack.title}</h3>
                                    <p className="text-white/50 text-xs truncate mt-1">{currentTrack.artist || playlist.name}</p>
                                </div>
                            </div>

                            {/* Progress */}
                            <div
                                className="w-full h-1 bg-white/10 rounded-full mb-4 cursor-pointer group"
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const x = e.clientX - rect.left;
                                    const newPlayed = x / rect.width;
                                    setProgress(newPlayed);
                                    playerRef.current?.seekTo(newPlayed);
                                }}
                            >
                                <div className="h-full bg-white rounded-full relative" style={{ width: `${progress * 100}%` }}>
                                    <div className="absolute -right-1.5 -top-1 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-lg" />
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Button size="icon" variant="ghost" onClick={handlePrev} className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8 rounded-full">
                                        <SkipBack className="w-4 h-4 fill-current" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        className="h-10 w-10 rounded-full bg-white text-black hover:bg-gray-200 hover:scale-105 transition-all shadow-lg"
                                        onClick={() => setIsPlaying(!isPlaying)}
                                    >
                                        {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
                                    </Button>
                                    <Button size="icon" variant="ghost" onClick={handleNext} className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8 rounded-full">
                                        <SkipForward className="w-4 h-4 fill-current" />
                                    </Button>
                                </div>

                                <div className="flex items-center gap-2 w-20">
                                    <Volume2 className="w-3 h-3 text-white/50" />
                                    <Slider
                                        value={[volume * 100]}
                                        onValueChange={(v) => setVolume(v[0] / 100)}
                                        max={100}
                                        step={1}
                                        className="h-1.5"
                                    />
                                </div>
                            </div>

                            {/* Playlist Preview */}
                            {playlist.items.length > 1 && (
                                <div className="mt-6 pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2 text-xs text-white/50 mb-3 uppercase tracking-wider font-semibold">
                                        <ListMusic className="w-3 h-3" />
                                        <span>Next Up</span>
                                    </div>
                                    <ScrollArea className="h-[100px] -mr-4 pr-4">
                                        <div className="space-y-1">
                                            {playlist.items.map((item: any, i: number) => (
                                                <div
                                                    key={item.id}
                                                    onClick={() => { setCurrentIndex(i); setIsPlaying(true); }}
                                                    className={cn(
                                                        "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors group",
                                                        i === currentIndex ? "bg-white/10" : "hover:bg-white/5"
                                                    )}
                                                >
                                                    <span className={cn("text-[10px] w-4 text-center", i === currentIndex ? "text-green-400" : "text-white/30")}>
                                                        {i + 1}
                                                    </span>
                                                    <p className={cn("text-xs truncate flex-1", i === currentIndex ? "text-white font-medium" : "text-white/70")}>{item.title}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>
                            )}
                        </div>
                    ) : (
                        // Mini Mode
                        <div className="flex items-center gap-3 w-full pl-2 cursor-pointer" onClick={() => setIsExpanded(true)}>
                            <div className={cn(
                                "w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg",
                                isPlaying && "animate-spin-slow" // Assume predefined or add style
                            )}>
                                <Music className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <p className="text-white text-sm font-bold truncate">{currentTrack.title}</p>
                                </div>
                            </div>
                            <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }} className="text-white hover:bg-white/10 rounded-full">
                                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Admin Dialog */}
            <MediaManager
                isOpen={isEditOpen}
                onOpenChange={setIsEditOpen}
                enableActiveToggle={true}
            />
        </div>
    );
}
