'use client';

import { useState, useRef, useTransition, useEffect } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
    Music, Trash2, Plus, ArrowRight, ArrowLeft, Loader2, Upload,
    CheckCircle2, ListMusic, PlayCircle, ExternalLink, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

// Actions
import {
    getPlaylists,
    createPlaylist,
    deletePlaylist,
    getPlaylist,
    addPlaylistItem,
    deletePlaylistItem,
    toggleActivePlaylist
} from '@/lib/actions/playlists';
import { uploadMedia } from '@/lib/actions/upload-media';
import { getPromoFiles, deletePromoFile } from '@/lib/actions/upload-promo';

interface MediaManagerProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectPlaylist?: (playlistId: string) => void; // For external selection
    enableActiveToggle?: boolean; // Show "Set Active" for Hero player
    defaultPlaylistId?: string; // If provided, opens in edit mode for this playlist
}

export function MediaManager({ isOpen, onOpenChange, onSelectPlaylist, enableActiveToggle = false, defaultPlaylistId }: MediaManagerProps) {
    const [step, setStep] = useState<'LIST' | 'EDIT'>('LIST');

    // Data State
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Form Stats
    const [newPlaylistName, setNewPlaylistName] = useState("");
    const [isCreating, startCreateTrans] = useTransition();

    // Load Initial Data
    useEffect(() => {
        if (isOpen) {
            loadPlaylists();
            if (defaultPlaylistId) {
                handleEditPlaylist(defaultPlaylistId);
            } else {
                setStep('LIST');
                setSelectedPlaylist(null);
            }
        }
    }, [isOpen, defaultPlaylistId]);

    const loadPlaylists = async () => {
        setIsLoading(true);
        const res = await getPlaylists();
        setPlaylists(res);
        setIsLoading(false);
    };

    const handleCreatePlaylist = async () => {
        if (!newPlaylistName) return;
        startCreateTrans(async () => {
            const res = await createPlaylist(newPlaylistName);
            if (res.success) {
                toast.success("Playlist Created");
                setNewPlaylistName("");
                loadPlaylists();
            }
        });
    };

    const handleDeleteClick = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Delete playlist?")) return;
        await deletePlaylist(id);
        toast.success("Deleted");
        loadPlaylists();
    };

    const handleEditPlaylist = async (id: string) => {
        setIsLoading(true);
        const p = await getPlaylist(id);
        setSelectedPlaylist(p);
        setStep('EDIT');
        setIsLoading(false);
    };

    const handleSetActive = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await toggleActivePlaylist(id);
        toast.success("Hero Player Updated");
        loadPlaylists();
    };

    // --- STEP 2: EDIT PLAYLIST ---
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl bg-[#0a0a0a] border-white/10 text-white h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            {step === 'EDIT' && (
                                <Button variant="ghost" size="icon" onClick={() => setStep('LIST')} className="mr-2 -ml-2 h-8 w-8 rounded-full hover:bg-white/10">
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                            )}
                            {step === 'LIST' ? "Media Library" : selectedPlaylist?.name}
                        </DialogTitle>
                        <DialogDescription className="text-white/50 hidden sm:block">
                            {step === 'LIST' ? "Manage your music collections" : "Add and remove tracks"}
                        </DialogDescription>
                    </div>
                    {step === 'EDIT' && onSelectPlaylist && (
                        <Button
                            className="bg-green-500 hover:bg-green-600 text-black font-bold"
                            onClick={() => {
                                onSelectPlaylist(selectedPlaylist.id);
                                onOpenChange(false);
                                toast.success("Playlist Selected");
                            }}
                        >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Select This Playlist
                        </Button>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden relative">
                    {step === 'LIST' ? (
                        <div className="p-6 h-full flex flex-col">
                            {/* Create New Bar */}
                            <div className="flex gap-4 mb-8 bg-white/5 p-4 rounded-xl border border-white/5">
                                <div className="h-12 w-12 rounded-lg bg-pink-500/20 flex items-center justify-center shrink-0">
                                    <ListMusic className="w-6 h-6 text-pink-500" />
                                </div>
                                <div className="flex-1 flex gap-3 items-center">
                                    <Input
                                        placeholder="Create New Playlist..."
                                        value={newPlaylistName}
                                        onChange={e => setNewPlaylistName(e.target.value)}
                                        className="h-12 bg-black/50 border-white/10 text-lg"
                                    />
                                    <Button onClick={handleCreatePlaylist} disabled={isCreating || !newPlaylistName} size="lg" className="h-12 px-8">
                                        {isCreating ? <Loader2 className="animate-spin" /> : "Create"}
                                    </Button>
                                </div>
                            </div>

                            <ScrollArea className="flex-1 -mx-6 px-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
                                    {playlists.map((p) => (
                                        <div
                                            key={p.id}
                                            onClick={() => handleEditPlaylist(p.id)}
                                            className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-xl p-4 transition-all cursor-pointer flex items-center gap-4"
                                        >
                                            <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                                                <Music className="w-8 h-8 text-white/80" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-bold text-lg truncate">{p.name}</h3>
                                                    {p.isActive && (
                                                        <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold border border-green-500/20">
                                                            HERO ACTIVE
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-white/40">{p._count?.items || 0} tracks</p>
                                            </div>

                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {enableActiveToggle && !p.isActive && (
                                                    <Button size="sm" variant="secondary" onClick={(e) => handleSetActive(p.id, e)} className="h-9 text-xs">
                                                        Set Active
                                                    </Button>
                                                )}
                                                <Button size="icon" variant="ghost" className="h-9 w-9 text-red-400 hover:bg-red-500/10" onClick={(e) => handleDeleteClick(p.id, e)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                                <div className="h-9 w-9 flex items-center justify-center rounded-full bg-white/10">
                                                    <ArrowRight className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    ) : (
                        <EditPlaylistView playlist={selectedPlaylist} onUpdate={() => handleEditPlaylist(selectedPlaylist.id)} />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function EditPlaylistView({ playlist, onUpdate }: { playlist: any, onUpdate: () => void }) {
    const [mode, setMode] = useState<'MANUAL' | 'LIBRARY'>('MANUAL');
    const [newItemTitle, setNewItemTitle] = useState("");
    const [newItemUrl, setNewItemUrl] = useState("");
    const [isAdding, startAdding] = useTransition();

    // Upload
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Library
    const [libraryFiles, setLibraryFiles] = useState<any[]>([]);
    const [loadingLib, setLoadingLib] = useState(false);

    const loadLibrary = async () => {
        setLoadingLib(true);
        const res = await getPromoFiles(); // We reuse the promo files library as a general media library
        if (res.success && res.files) {
            setLibraryFiles(res.files);
        }
        setLoadingLib(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'music');

        const res = await uploadMedia(formData); // Use generic upload media
        if (res.success && res.url) {
            setNewItemUrl(res.url);
            if (!newItemTitle) {
                setNewItemTitle(file.name.replace(/\.[^/.]+$/, ""));
            }
            toast.success("Uploaded!");
        } else {
            toast.error("Upload Failed");
        }
        setIsUploading(false);
    };

    const handleAddItem = async () => {
        if (!newItemUrl || !newItemTitle) return;
        startAdding(async () => {
            const type = newItemUrl.includes('youtu') ? 'YOUTUBE' : 'MP3';
            await addPlaylistItem(playlist.id, {
                title: newItemTitle,
                url: newItemUrl,
                type
            });
            toast.success("Track Added");
            setNewItemUrl("");
            setNewItemTitle("");
            onUpdate();
        });
    };

    const handleDeleteItem = async (itemId: string) => {
        await deletePlaylistItem(itemId);
        toast.success("Removed");
        onUpdate();
    };

    const handleAddFromLibrary = async (file: any) => {
        await addPlaylistItem(playlist.id, {
            title: file.name.replace(/\.[^/.]+$/, ""),
            url: file.url,
            type: 'MP3' // Library files are mostly MP3s if audio
        });
        toast.success("Added from Library");
        onUpdate();
    };

    return (
        <div className="h-full flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/10">
            {/* Left: Track List */}
            <div className="flex-1 flex flex-col h-[50%] md:h-full">
                <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                    <h3 className="font-bold text-sm text-white/50 uppercase tracking-wider">Current Tracks</h3>
                </div>
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-2">
                        {playlist.items.length === 0 && (
                            <div className="py-10 text-center text-white/30 border-2 border-dashed border-white/10 rounded-xl">
                                No tracks yet. Add some from the right panel.
                            </div>
                        )}
                        {playlist.items.map((item: any, i: number) => (
                            <div key={item.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5 group hover:bg-white/10 transition-colors">
                                <span className="text-white/30 font-mono text-xs w-6">{i + 1}</span>
                                <div className="h-10 w-10 rounded bg-black/40 flex items-center justify-center shrink-0">
                                    {item.type === 'YOUTUBE' ? <PlayCircle className="w-5 h-5 text-red-500" /> : <Music className="w-5 h-5 text-blue-400" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate text-sm">{item.title}</p>
                                    <p className="text-xs text-white/30 truncate max-w-[200px]">{item.url}</p>
                                </div>
                                <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-500/10" onClick={() => handleDeleteItem(item.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Right: Add Tools */}
            <div className="flex-1 flex flex-col h-[50%] md:h-full bg-white/[0.02] min-w-0">
                <div className="flex border-b border-white/10">
                    <button
                        onClick={() => setMode('MANUAL')}
                        className={cn("flex-1 py-4 text-sm font-bold border-b-2 transition-colors", mode === 'MANUAL' ? "border-pink-500 text-white" : "border-transparent text-white/40 hover:text-white")}
                    >
                        Upload / Link
                    </button>
                    <button
                        onClick={() => { setMode('LIBRARY'); loadLibrary(); }}
                        className={cn("flex-1 py-4 text-sm font-bold border-b-2 transition-colors", mode === 'LIBRARY' ? "border-pink-500 text-white" : "border-transparent text-white/40 hover:text-white")}
                    >
                        Library
                    </button>
                </div>

                <div className="flex-1 overflow-hidden relative">
                    {mode === 'MANUAL' ? (
                        <ScrollArea className="h-full">
                            <div className="p-6 space-y-6">
                                {/* Upload Box */}
                                <div
                                    className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center gap-4 hover:bg-white/5 transition-colors cursor-pointer group"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input type="file" ref={fileInputRef} className="hidden" accept="audio/*" onChange={handleFileUpload} />
                                    <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        {isUploading ? <Loader2 className="w-6 h-6 animate-spin text-pink-500" /> : <Upload className="w-6 h-6 text-pink-500" />}
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-sm">Click to Upload MP3</p>
                                        <p className="text-xs text-white/40 mt-1">or drag and drop here</p>
                                    </div>
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#0a0a0a] px-2 text-white/30">Or add manually</span></div>
                                </div>

                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Track Title</Label>
                                        <Input value={newItemTitle} onChange={e => setNewItemTitle(e.target.value)} placeholder="My Awesome Song" className="bg-black/20" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Media URL (MP3 or YouTube)</Label>
                                        <Input value={newItemUrl} onChange={e => setNewItemUrl(e.target.value)} placeholder="https://..." className="bg-black/20" />
                                    </div>
                                    <Button className="w-full mt-2" onClick={handleAddItem} disabled={!newItemUrl || !newItemTitle || isAdding}>
                                        {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                                        Add to Playlist
                                    </Button>
                                    {/* Spacer for bottom scrolling */}
                                    <div className="h-10" />
                                </div>
                            </div>
                        </ScrollArea>
                    ) : (
                        <div className="flex flex-col h-full">
                            <div className="px-4 py-2 flex justify-between items-center border-b border-white/5">
                                <span className="text-xs text-white/40">From Server Storage</span>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={loadLibrary}><RefreshCw className={cn("w-3 h-3", loadingLib && "animate-spin")} /></Button>
                            </div>
                            <ScrollArea className="flex-1 p-4">
                                <div className="space-y-2">
                                    {libraryFiles.filter(f => f.type !== 'image').map((file, i) => (
                                        <div key={i} className="flex items-center gap-3 p-2 bg-white/5 rounded hover:bg-white/10 group cursor-pointer" onClick={() => handleAddFromLibrary(file)}>
                                            <Music className="w-4 h-4 text-white/40" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm truncate">{file.name}</p>
                                            </div>
                                            <Plus className="w-4 h-4 text-green-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
