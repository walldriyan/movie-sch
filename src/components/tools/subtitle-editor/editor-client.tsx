'use client';

import React, { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileUp, Play, Pause, Download, RotateCcw, Type, Settings2, Maximize2, Pin, PinOff, Save } from 'lucide-react';
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
}, (prev, next) => prev.isActive === next.isActive && prev.sub.translation === next.sub.translation && prev.sub.id === next.sub.id);

SubtitleListItem.displayName = 'SubtitleListItem';

export default function SubtitleEditorClient() {
    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
    const [activeIndex, setActiveIndex] = useState<number>(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [previewText, setPreviewText] = useState('');
    const [isPinned, setIsPinned] = useState(false);

    const currentTimeRef = useRef(0);
    const durationRef = useRef(0);
    const [displayTime, setDisplayTime] = useState('00:00:00');
    const [sliderValue, setSliderValue] = useState(0);

    const videoRef = useRef<HTMLVideoElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const timeUpdateThrottleRef = useRef<number>(0);

    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            if (videoSrc) URL.revokeObjectURL(videoSrc);
        };
    }, [videoSrc]);

    const handleVideoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
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

    useEffect(() => {
        if (subtitles.length > 0) {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = setTimeout(() => {
                localStorage.setItem('subtitle-draft', JSON.stringify(subtitles));
            }, 2000);
        }
    }, [subtitles]);

    const findActiveIndex = useCallback((time: number): number => {
        if (subtitles.length === 0) return -1;
        let left = 0, right = subtitles.length - 1;
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const sub = subtitles[mid];
            if (time >= sub.start && time <= sub.end) return mid;
            else if (time < sub.start) right = mid - 1;
            else left = mid + 1;
        }
        return -1;
    }, [subtitles]);

    const handleTimeUpdate = useCallback(() => {
        if (!videoRef.current) return;
        const now = Date.now();
        const currentTime = videoRef.current.currentTime;
        currentTimeRef.current = currentTime;

        if (now - timeUpdateThrottleRef.current > 250) {
            timeUpdateThrottleRef.current = now;
            setDisplayTime(formatTimeShort(currentTime));
            setSliderValue(currentTime);
            const newIndex = findActiveIndex(currentTime);
            if (newIndex !== -1 && newIndex !== activeIndex) {
                setActiveIndex(newIndex);
            }
        }
    }, [findActiveIndex, activeIndex]);

    useEffect(() => {
        if (activeIndex >= 0 && activeIndex < subtitles.length) {
            const el = document.getElementById(`sub-${activeIndex}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (inputRef.current) {
                inputRef.current.value = subtitles[activeIndex].translation;
                setPreviewText(subtitles[activeIndex].translation);
            }
        }
    }, [activeIndex, subtitles]);

    const jumpToSubtitle = useCallback((index: number) => {
        if (index >= 0 && index < subtitles.length) {
            if (videoRef.current) {
                videoRef.current.currentTime = subtitles[index].start;
            }
            setActiveIndex(index);
        }
    }, [subtitles]);

    const handleSaveInput = useCallback(() => {
        if (activeIndex === -1 || !inputRef.current) return;
        const newTranslation = inputRef.current.value;
        setSubtitles(prev => {
            if (prev[activeIndex].translation === newTranslation) return prev;
            const newSubs = [...prev];
            newSubs[activeIndex] = { ...newSubs[activeIndex], translation: newTranslation };
            return newSubs;
        });
    }, [activeIndex]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setPreviewText(e.target.value), []);

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

    const togglePlayPause = useCallback(() => {
        if (videoRef.current) {
            videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
        }
    }, []);

    const skipTime = useCallback((delta: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime += delta;
        }
    }, []);

    const subtitleList = useMemo(() => subtitles.map((sub, idx) => (
        <SubtitleListItem key={sub.id} sub={sub} idx={idx} isActive={activeIndex === idx} onJump={jumpToSubtitle} />
    )), [subtitles, activeIndex, jumpToSubtitle]);

    return (
        <div className="min-h-screen bg-background text-foreground pt-28 pb-10 px-4 md:px-8">
            <div className="max-w-[1800px] mx-auto h-[calc(100vh-140px)] flex flex-col rounded-3xl border bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="h-16 border-b bg-black/20 px-6 flex items-center justify-between shrink-0 z-20 relative">
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
                                <input type="file" accept="video/*" onChange={handleVideoUpload} className="absolute inset-0 opacity-0 cursor-pointer text-[0px]" title="" />
                                <Button variant="secondary" size="sm" className="gap-2 h-9 text-xs font-medium bg-white/5 hover:bg-white/10 border-white/5 border">
                                    <FileUp className="w-3.5 h-3.5" /> {videoSrc ? 'Replace Video' : 'Load Video'}
                                </Button>
                            </div>
                            <div className="relative">
                                <input type="file" accept=".srt" onChange={handleSubtitleUpload} className="absolute inset-0 opacity-0 cursor-pointer text-[0px]" title="" />
                                <Button variant="secondary" size="sm" className="gap-2 h-9 text-xs font-medium bg-white/5 hover:bg-white/10 border-white/5 border">
                                    <Type className="w-3.5 h-3.5" /> {subtitles.length > 0 ? `${subtitles.length} Lines` : 'Load SRT'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">

                    {/* LEFT COLUMN: Player & Editor */}
                    <div className="flex-[2] flex flex-col border-r border-white/5 bg-black/40 relative">

                        {/* 1. Video Player Area with Overlay Controls */}
                        <div className="flex-1 relative flex items-center justify-center bg-black group overflow-hidden">
                            {videoSrc ? (
                                <video
                                    ref={videoRef}
                                    src={videoSrc}
                                    className="w-full h-full object-contain"
                                    onLoadedMetadata={() => { durationRef.current = videoRef.current?.duration || 0; }}
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

                            {/* Typing Preview Overlay */}
                            {activeIndex !== -1 && previewText && (
                                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-center w-full px-8 pointer-events-none z-10">
                                    <span className="inline-block bg-black/70 text-yellow-400 px-6 py-3 rounded-xl text-2xl font-bold backdrop-blur-md shadow-lg leading-relaxed border border-white/5">
                                        {previewText}
                                    </span>
                                </div>
                            )}

                            {/* Top Details Overlay (Only on Hover or Pinned) */}
                            <div className={cn(
                                "absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300 z-30",
                                isPinned ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                            )}>
                                <div className="flex justify-between items-center text-xs font-mono text-white/70">
                                    <div className="flex items-center gap-3">
                                        <div className="px-3 py-1 bg-white/10 rounded-full backdrop-blur-md border border-white/5">
                                            {formatTimeShort(sliderValue)} <span className="opacity-50 mx-1">/</span> {formatTimeShort(durationRef.current)}
                                        </div>
                                        {videoSrc && <div className="hidden sm:flex items-center gap-2"><Badge variant="secondary" className="bg-white/10 hover:bg-white/20 text-[10px] font-normal tracking-wider">HD</Badge></div>}
                                    </div>

                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className={cn(
                                            "w-8 h-8 rounded-full hover:bg-white/20 transition-colors",
                                            isPinned ? "bg-white/20 text-white" : "text-white/50"
                                        )}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsPinned(!isPinned);
                                        }}
                                        title={isPinned ? "Unpin Controls" : "Pin Controls"}
                                    >
                                        {isPinned ? <Pin className="w-4 h-4 fill-current" /> : <PinOff className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>

                            {/* Bottom Controls Overlay (Hover or Pinned) */}
                            <div className={cn(
                                "absolute bottom-0 left-0 right-0 p-4 pt-12 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-300 z-20 flex flex-col gap-2",
                                isPinned ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                            )}>
                                {/* Timeline */}
                                <div className="w-full px-1 group/slider">
                                    <Slider
                                        value={[sliderValue]}
                                        max={durationRef.current || 100}
                                        step={0.1}
                                        onValueChange={(vals) => {
                                            setSliderValue(vals[0]);
                                            if (videoRef.current) videoRef.current.currentTime = vals[0];
                                        }}
                                        className="cursor-pointer py-2 hover:scale-y-110 transition-transform"
                                    />
                                </div>

                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-3">
                                        <Button
                                            size="icon"
                                            className="h-10 w-10 rounded-full bg-white text-black hover:bg-white/90 hover:scale-105 transition-all shadow-lg shadow-white/10"
                                            onClick={togglePlayPause}
                                        >
                                            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                                        </Button>

                                        <div className="flex bg-white/10 rounded-lg p-0.5 border border-white/5 backdrop-blur-md">
                                            <Button size="icon" variant="ghost" className="w-8 h-8 rounded-md hover:bg-white/10 text-white/80" onClick={() => skipTime(-5)}>
                                                <span className="text-[10px] font-bold">-5s</span>
                                            </Button>
                                            <Button size="icon" variant="ghost" className="w-8 h-8 rounded-md hover:bg-white/10 text-white/80" onClick={() => skipTime(5)}>
                                                <span className="text-[10px] font-bold">+5s</span>
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 bg-white/10 rounded-lg p-0.5 px-1 border border-white/5 backdrop-blur-md">
                                        <span className="text-[10px] uppercase font-bold text-white/60 ml-2">Speed</span>
                                        <select
                                            className="bg-transparent border-none text-xs p-1.5 outline-none font-medium text-white cursor-pointer focus:ring-0"
                                            value={playbackRate}
                                            onChange={(e) => {
                                                const rate = parseFloat(e.target.value);
                                                setPlaybackRate(rate);
                                                if (videoRef.current) videoRef.current.playbackRate = rate;
                                            }}
                                        >
                                            <option className="text-black" value="0.5">0.5x</option>
                                            <option className="text-black" value="1">1.0x</option>
                                            <option className="text-black" value="1.5">1.5x</option>
                                            <option className="text-black" value="2">2.0x</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Editor Section (Separated & Styled) */}
                        <div className="shrink-0 bg-card/10 backdrop-blur-xl border-t border-white/5 p-6 z-30">
                            {activeIndex !== -1 ? (
                                <div className="max-w-4xl mx-auto flex flex-col gap-3">
                                    {/* Original Card */}
                                    <div className="bg-gradient-to-br from-primary/5 to-transparent rounded-2xl border border-primary/10 px-5 py-3 shadow-inner relative group/card">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="text-[10px] text-primary/70 font-bold uppercase tracking-widest">Original Audio</div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-[10px] font-mono opacity-40">{formatTimeShort(subtitles[activeIndex].start)}</div>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 gap-1.5 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                                                    onClick={exportSRT}
                                                >
                                                    <Save className="w-3 h-3" /> Save File
                                                </Button>
                                            </div>
                                        </div>
                                        <p className="text-lg font-medium leading-relaxed text-sky-200 drop-shadow-sm">
                                            {stripHtmlTags(subtitles[activeIndex].text)}
                                        </p>
                                    </div>

                                    {/* Input Card */}
                                    <div className="relative group/input">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-blue-500/30 rounded-2xl blur opacity-20 group-focus-within/input:opacity-50 transition duration-500" />
                                        <Input
                                            ref={inputRef}
                                            defaultValue={subtitles[activeIndex].translation}
                                            onChange={handleInputChange}
                                            onKeyDown={handleEnterKey}
                                            onBlur={handleSaveInput}
                                            placeholder="Translate into Sinhala..."
                                            className="relative h-14 w-full pl-5 pr-28 text-xl bg-black/60 border-white/10 focus:border-white/20 focus:bg-black/80 rounded-xl shadow-2xl transition-all placeholder:text-muted-foreground/40"
                                            autoComplete="off"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                            <Badge variant="outline" className="h-7 bg-white/5 border-white/10 text-muted-foreground text-[10px] gap-1 hover:bg-white/10">
                                                <span>RETURN</span> <span className="text-xs">↵</span>
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl bg-white/5 text-muted-foreground/50">
                                    <Type className="w-8 h-8 mb-2 opacity-50" />
                                    <p className="text-sm font-medium">Select a line to translate</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Transcript */}
                    <div className="w-[380px] shrink-0 bg-black/20 flex flex-col border-l border-white/5 backdrop-blur-sm">
                        <div className="p-4 border-b border-white/5 flex justify-between items-center">
                            <span className="font-semibold text-sm tracking-tight">Timeline</span>
                            <Badge variant="secondary" className="text-[10px] h-5 bg-white/10 hover:bg-white/20">{subtitles.length} SEGMENTS</Badge>
                        </div>
                        <ScrollArea className="flex-1" ref={listRef}>
                            <div className="flex flex-col p-2 gap-1 pb-10">
                                {subtitleList}
                                {subtitles.length === 0 && (
                                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-muted-foreground/40 min-h-[400px]">
                                        <FileUp className="w-12 h-12 mb-4" />
                                        <p>No subtitles</p>
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
