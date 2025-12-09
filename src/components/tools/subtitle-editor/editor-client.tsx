'use client';

import React, { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileUp, Play, Pause, Download, RotateCcw, Type } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface Subtitle {
    id: number;
    start: number;
    end: number;
    text: string;
    translation: string;
}

const parseTime = (timeStr: string): number => {
    const [hms, ms] = timeStr.split(',');
    const [h, m, s] = hms.split(':').map(Number);
    return h * 3600 + m * 60 + s + Number(ms) / 1000;
};

const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
};

const formatTimeShort = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const stripHtmlTags = (text: string): string => text.replace(/<[^>]*>/g, '');

// Memoized subtitle list item - NO previewText prop, only re-renders when its own data changes
const SubtitleListItem = memo(({
    sub,
    idx,
    isActive,
    onJump
}: {
    sub: Subtitle;
    idx: number;
    isActive: boolean;
    onJump: (idx: number) => void;
}) => {
    const cleanText = useMemo(() => stripHtmlTags(sub.text), [sub.text]);

    return (
        <div
            id={`sub-${idx}`}
            onClick={() => onJump(idx)}
            className={cn(
                "p-3 rounded-lg cursor-pointer transition-all duration-200 text-sm flex gap-3 group relative border border-transparent",
                isActive
                    ? "bg-primary/10 border-primary/20 shadow-sm z-10 scale-[1.02]"
                    : "hover:bg-white/5 hover:border-white/5",
                !sub.translation && !isActive && "opacity-70"
            )}
        >
            <div className="text-[10px] text-muted-foreground font-mono shrink-0 pt-1 opacity-50 tabular-nums">
                {formatTimeShort(sub.start)}
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-muted-foreground/70 text-[11px] leading-tight mb-1.5">
                    {cleanText}
                </div>
                <div className={cn(
                    "font-medium leading-snug break-words",
                    sub.translation ? "text-foreground" : "text-muted-foreground/30 italic"
                )}>
                    {sub.translation || (isActive ? 'Type translation...' : 'Untranslated')}
                </div>
            </div>
            {isActive && (
                <div className="absolute right-3 top-3 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(236,72,153,0.8)]" />
            )}
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison - only re-render if these specific things change
    return prevProps.isActive === nextProps.isActive &&
        prevProps.sub.translation === nextProps.sub.translation &&
        prevProps.sub.id === nextProps.sub.id;
});

SubtitleListItem.displayName = 'SubtitleListItem';

export default function SubtitleEditorClient() {
    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
    const [activeIndex, setActiveIndex] = useState<number>(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [previewText, setPreviewText] = useState('');

    // Use refs for frequently updated values to avoid re-renders
    const currentTimeRef = useRef(0);
    const durationRef = useRef(0);
    const [displayTime, setDisplayTime] = useState('00:00:00');
    const [sliderValue, setSliderValue] = useState(0);

    const videoRef = useRef<HTMLVideoElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const timeUpdateThrottleRef = useRef<number>(0);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            if (videoSrc) URL.revokeObjectURL(videoSrc);
        };
    }, [videoSrc]);

    const handleVideoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Revoke old URL to prevent memory leak
            if (videoSrc) URL.revokeObjectURL(videoSrc);
            const url = URL.createObjectURL(file);
            setVideoSrc(url);
        }
    }, [videoSrc]);

    const handleSubtitleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const text = ev.target?.result as string;
                parseSRT(text);
            };
            reader.readAsText(file);
        }
    }, []);

    const parseSRT = useCallback((rawText: string) => {
        const text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const blocks = text.split('\n\n');
        const parsed: Subtitle[] = [];

        for (let i = 0; i < blocks.length; i++) {
            const lines = blocks[i].trim().split('\n');
            if (lines.length >= 2) {
                const timeLineIndex = lines.findIndex(l => l.includes('-->'));
                if (timeLineIndex !== -1) {
                    const timeLine = lines[timeLineIndex];
                    const parts = timeLine.split('-->');
                    if (parts.length === 2) {
                        const startStr = parts[0].trim();
                        const endStr = parts[1].trim();
                        const content = lines.slice(timeLineIndex + 1).join('\n').trim();

                        if (startStr && endStr && content) {
                            parsed.push({
                                id: parsed.length + 1,
                                start: parseTime(startStr),
                                end: parseTime(endStr),
                                text: content,
                                translation: ''
                            });
                        }
                    }
                }
            }
        }

        console.log(`Parsed ${parsed.length} subtitles`);

        // Load saved translations
        const saved = localStorage.getItem('subtitle-draft');
        if (saved) {
            try {
                const savedData = JSON.parse(saved);
                if (Array.isArray(savedData) && savedData.length === parsed.length) {
                    for (let i = 0; i < parsed.length; i++) {
                        parsed[i].translation = savedData[i].translation || '';
                    }
                }
            } catch (e) {
                console.error("Failed to load draft", e);
            }
        }

        setSubtitles(parsed);
    }, []);

    // Debounced localStorage save
    useEffect(() => {
        if (subtitles.length > 0) {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = setTimeout(() => {
                localStorage.setItem('subtitle-draft', JSON.stringify(subtitles));
            }, 2000); // Increased to 2 seconds
        }
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [subtitles]);

    // Binary search for finding active subtitle index - O(log n) instead of O(n)
    const findActiveIndex = useCallback((time: number): number => {
        if (subtitles.length === 0) return -1;

        let left = 0;
        let right = subtitles.length - 1;

        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const sub = subtitles[mid];

            if (time >= sub.start && time <= sub.end) {
                return mid;
            } else if (time < sub.start) {
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        }

        return -1;
    }, [subtitles]);

    // Throttled time update - only update UI every 250ms
    const handleTimeUpdate = useCallback(() => {
        if (!videoRef.current) return;

        const now = Date.now();
        const currentTime = videoRef.current.currentTime;
        currentTimeRef.current = currentTime;

        // Throttle UI updates to every 250ms
        if (now - timeUpdateThrottleRef.current > 250) {
            timeUpdateThrottleRef.current = now;
            setDisplayTime(formatTimeShort(currentTime));
            setSliderValue(currentTime);

            // Find and update active index
            const newIndex = findActiveIndex(currentTime);
            if (newIndex !== -1 && newIndex !== activeIndex) {
                setActiveIndex(newIndex);
            }
        }
    }, [findActiveIndex, activeIndex]);

    // Scroll to active item
    useEffect(() => {
        if (activeIndex >= 0 && activeIndex < subtitles.length) {
            const el = document.getElementById(`sub-${activeIndex}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            if (inputRef.current) {
                inputRef.current.value = subtitles[activeIndex].translation;
                setPreviewText(subtitles[activeIndex].translation);
                inputRef.current.focus();
            }
        }
    }, [activeIndex, subtitles]);

    const jumpToSubtitle = useCallback((index: number) => {
        if (index >= 0 && index < subtitles.length) {
            if (videoRef.current) {
                videoRef.current.currentTime = subtitles[index].start;
                currentTimeRef.current = subtitles[index].start;
                setSliderValue(subtitles[index].start);
                setDisplayTime(formatTimeShort(subtitles[index].start));
            }
            setActiveIndex(index);
        }
    }, [subtitles]);

    const handleSaveInput = useCallback(() => {
        if (activeIndex === -1 || !inputRef.current) return;
        const newTranslation = inputRef.current.value;

        setSubtitles(prev => {
            // Only update if translation actually changed
            if (prev[activeIndex].translation === newTranslation) return prev;

            const newSubs = [...prev];
            newSubs[activeIndex] = { ...newSubs[activeIndex], translation: newTranslation };
            return newSubs;
        });
    }, [activeIndex]);

    // Direct preview update - no debounce for instant feedback
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setPreviewText(e.target.value);
    }, []);

    const handleEnterKey = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSaveInput();

            if (activeIndex < subtitles.length - 1) {
                jumpToSubtitle(activeIndex + 1);
                if (videoRef.current && !videoRef.current.paused) {
                    videoRef.current.pause();
                    setIsPlaying(false);
                }
            }
        }
    }, [activeIndex, subtitles.length, handleSaveInput, jumpToSubtitle]);

    const exportSRT = useCallback(() => {
        const lines: string[] = [];
        for (let i = 0; i < subtitles.length; i++) {
            const s = subtitles[i];
            lines.push(`${i + 1}`);
            lines.push(`${formatTime(s.start)} --> ${formatTime(s.end)}`);
            lines.push(s.translation || '');
            lines.push('');
        }
        const content = lines.join('\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'subtitle_sinhala.srt';
        a.click();
        URL.revokeObjectURL(url);
    }, [subtitles]);

    const handleSliderChange = useCallback((vals: number[]) => {
        const newTime = vals[0];
        setSliderValue(newTime);
        setDisplayTime(formatTimeShort(newTime));
        if (videoRef.current) {
            videoRef.current.currentTime = newTime;
            currentTimeRef.current = newTime;
        }
    }, []);

    const togglePlayPause = useCallback(() => {
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play();
            } else {
                videoRef.current.pause();
            }
        }
    }, []);

    const skipTime = useCallback((delta: number) => {
        if (videoRef.current) {
            const newTime = videoRef.current.currentTime + delta;
            videoRef.current.currentTime = newTime;
            currentTimeRef.current = newTime;
            setSliderValue(newTime);
            setDisplayTime(formatTimeShort(newTime));
        }
    }, []);

    // Memoized subtitle list to prevent re-renders when previewText changes
    const subtitleList = useMemo(() => (
        subtitles.map((sub, idx) => (
            <SubtitleListItem
                key={sub.id}
                sub={sub}
                idx={idx}
                isActive={activeIndex === idx}
                onJump={jumpToSubtitle}
            />
        ))
    ), [subtitles, activeIndex, jumpToSubtitle]);

    return (
        <div className="min-h-screen bg-background text-foreground pt-28 pb-10 px-4 md:px-8">
            <div className="max-w-[1800px] mx-auto h-[calc(100vh-140px)] flex flex-col rounded-3xl border bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden">

                <div className="h-16 border-b bg-black/20 px-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                                <Type className="w-5 h-5" />
                            </span>
                            <h1 className="font-bold text-lg tracking-tight">
                                Subtitle<span className="text-primary">Studio</span>
                            </h1>
                        </div>
                        <div className="h-6 w-px bg-white/10" />
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <input type="file" accept="video/*" onChange={handleVideoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                <Button variant="secondary" size="sm" className="gap-2 h-9 text-xs font-medium bg-white/5 hover:bg-white/10 border-white/5 border">
                                    <FileUp className="w-3.5 h-3.5" /> {videoSrc ? 'Replace Video' : 'Load Video'}
                                </Button>
                            </div>
                            <div className="relative">
                                <input type="file" accept=".srt" onChange={handleSubtitleUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                <Button variant="secondary" size="sm" className="gap-2 h-9 text-xs font-medium bg-white/5 hover:bg-white/10 border-white/5 border">
                                    <Type className="w-3.5 h-3.5" /> {subtitles.length > 0 ? `${subtitles.length} Lines` : 'Load SRT'}
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-9 text-xs text-muted-foreground hover:text-red-400" onClick={() => {
                            setSubtitles([]);
                            setActiveIndex(-1);
                            localStorage.removeItem('subtitle-draft');
                        }}>
                            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset
                        </Button>
                        <Button onClick={exportSRT} size="sm" className="gap-2 h-9 text-xs font-bold bg-gradient-to-r from-primary to-orange-500 hover:opacity-90 transition-opacity border-0">
                            <Download className="w-3.5 h-3.5" /> Export SRT
                        </Button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">

                    <div className="flex-[2] flex flex-col border-r border-white/5 bg-black/40 relative group overflow-hidden">

                        <div className="flex-1 min-h-0 relative flex items-center justify-center bg-black/20 p-4">
                            <div className="relative w-full h-full flex items-center justify-center rounded-2xl overflow-hidden bg-black/50 border border-white/5 shadow-inner">
                                {videoSrc ? (
                                    <video
                                        ref={videoRef}
                                        src={videoSrc}
                                        className="max-w-full max-h-full w-auto h-auto object-contain"
                                        onLoadedMetadata={() => {
                                            durationRef.current = videoRef.current?.duration || 0;
                                        }}
                                        onTimeUpdate={handleTimeUpdate}
                                        onPlay={() => setIsPlaying(true)}
                                        onPause={() => setIsPlaying(false)}
                                        onClick={togglePlayPause}
                                    />
                                ) : (
                                    <div className="text-muted-foreground/30 flex flex-col items-center">
                                        <FileUp className="w-20 h-20 mb-6 opacity-10" />
                                        <p className="font-light tracking-wide">Drop a video here to start</p>
                                    </div>
                                )}

                                {/* Real-time Preview - isolated from list */}
                                {activeIndex !== -1 && previewText && (
                                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center w-full px-8 pointer-events-none">
                                        <span className="inline-block bg-black/70 text-yellow-400 px-6 py-3 rounded-xl text-2xl font-bold backdrop-blur-md shadow-lg leading-relaxed">
                                            {previewText}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="h-[260px] shrink-0 bg-card/30 backdrop-blur-md border-t border-white/5 p-6 flex flex-col gap-4">
                            <div className="w-full px-1">
                                <Slider
                                    value={[sliderValue]}
                                    max={durationRef.current || 100}
                                    step={0.1}
                                    onValueChange={handleSliderChange}
                                    className="cursor-pointer py-2"
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 bg-black/20 p-1 rounded-lg border border-white/5">
                                    <Button size="icon" variant="ghost" className="w-8 h-8 rounded-md hover:bg-white/10" onClick={() => skipTime(-5)}>
                                        <span className="text-[10px] font-bold">-5s</span>
                                    </Button>
                                    <Button
                                        size="icon"
                                        className="h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                                        onClick={togglePlayPause}
                                    >
                                        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                                    </Button>
                                    <Button size="icon" variant="ghost" className="w-8 h-8 rounded-md hover:bg-white/10" onClick={() => skipTime(5)}>
                                        <span className="text-[10px] font-bold">+5s</span>
                                    </Button>
                                </div>

                                <div className="text-sm font-mono font-medium text-muted-foreground bg-black/20 px-3 py-1.5 rounded-md border border-white/5">
                                    {displayTime} <span className="text-muted-foreground/40 mx-1">/</span> {formatTimeShort(durationRef.current)}
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Speed</span>
                                    <select
                                        className="bg-black/20 border border-white/10 rounded-md text-xs p-1.5 outline-none focus:border-primary/50 cursor-pointer"
                                        value={playbackRate}
                                        onChange={(e) => {
                                            const rate = parseFloat(e.target.value);
                                            setPlaybackRate(rate);
                                            if (videoRef.current) videoRef.current.playbackRate = rate;
                                        }}
                                    >
                                        <option value="0.5">0.5x</option>
                                        <option value="1">1.0x</option>
                                        <option value="1.5">1.5x</option>
                                        <option value="2">2.0x</option>
                                    </select>
                                </div>
                            </div>

                            {activeIndex !== -1 ? (
                                <div className="flex flex-col gap-3">
                                    <div className="bg-black/20 rounded-xl border border-white/5 px-4 py-3">
                                        <div className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider font-bold opacity-60">Original</div>
                                        <p className="text-sm font-medium leading-relaxed text-muted-foreground/90">
                                            {stripHtmlTags(subtitles[activeIndex].text)}
                                        </p>
                                    </div>

                                    <div className="relative">
                                        <Input
                                            ref={inputRef}
                                            defaultValue={subtitles[activeIndex].translation}
                                            onChange={handleInputChange}
                                            onKeyDown={handleEnterKey}
                                            onBlur={handleSaveInput}
                                            placeholder="Enter Sinhala translation..."
                                            className="h-14 pl-4 pr-24 text-lg bg-black/20 border-white/10 focus:border-primary/50 focus:bg-black/30 rounded-xl shadow-inner transition-all"
                                            autoComplete="off"
                                        />
                                        <div className="absolute right-2 top-2 bottom-2 flex items-center">
                                            <kbd className="hidden sm:inline-flex h-8 items-center gap-1 rounded border border-white/10 bg-white/5 px-2 font-mono text-[10px] font-medium text-muted-foreground">
                                                <span className="text-xs">↵</span> ENTER
                                            </kbd>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-white/5 rounded-xl bg-white/5">
                                    <p className="text-sm text-muted-foreground p-4">Select a subtitle line to start editing</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="w-[400px] shrink-0 bg-muted/5 flex flex-col border-l border-white/5">
                        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-transparent">
                            <span className="font-semibold text-sm">Transcript</span>
                            <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">{subtitles.length} Lines</Badge>
                        </div>
                        <ScrollArea className="flex-1" ref={listRef}>
                            <div className="flex flex-col p-2 gap-1">
                                {subtitleList}
                                {subtitles.length === 0 && (
                                    <div className="p-12 text-center flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                        <Type className="w-12 h-12 mb-4 opacity-50" />
                                        <p>No subtitles loaded</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                </div>
            </div>
        </div>
    );
}
