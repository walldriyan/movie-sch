'use client';

import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
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
    const date = new Date(seconds * 1000);
    const h = date.getUTCHours().toString().padStart(2, '0');
    const m = date.getUTCMinutes().toString().padStart(2, '0');
    const s = date.getUTCSeconds().toString().padStart(2, '0');
    const ms = date.getUTCMilliseconds().toString().padStart(3, '0');
    return `${h}:${m}:${s},${ms}`;
};

// Strip HTML tags from subtitle text
const stripHtmlTags = (text: string): string => {
    return text.replace(/<[^>]*>/g, '');
};

// Memoized subtitle list item
const SubtitleListItem = memo(({
    sub,
    idx,
    activeIndex,
    previewText,
    onJump
}: {
    sub: Subtitle;
    idx: number;
    activeIndex: number;
    previewText: string;
    onJump: (idx: number) => void;
}) => {
    const isActive = activeIndex === idx;
    const displayText = isActive && previewText ? previewText : sub.translation;
    const cleanText = stripHtmlTags(sub.text);

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
                {formatTime(sub.start).split(',')[0]}
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-muted-foreground/70 text-[11px] leading-tight mb-1.5">
                    {cleanText}
                </div>
                <div className={cn(
                    "font-medium leading-snug break-words",
                    displayText ? "text-foreground" : "text-muted-foreground/30 italic"
                )}>
                    {displayText || (isActive ? 'Type translation...' : 'Untranslated')}
                </div>
            </div>
            {isActive && (
                <div className="absolute right-3 top-3 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(236,72,153,0.8)]" />
            )}
        </div>
    );
});

SubtitleListItem.displayName = 'SubtitleListItem';

export default function SubtitleEditorClient() {
    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
    const [activeIndex, setActiveIndex] = useState<number>(-1);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [previewText, setPreviewText] = useState('');

    const videoRef = useRef<HTMLVideoElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleVideoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setVideoSrc(url);
        }
    }, []);

    const handleSubtitleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                parseSRT(text);
            };
            reader.readAsText(file);
        }
    }, []);

    const parseSRT = useCallback((rawText: string) => {
        const text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const blocks = text.split('\n\n');
        const parsed: Subtitle[] = [];

        blocks.forEach((block) => {
            const lines = block.trim().split('\n');
            if (lines.length >= 2) {
                const timeLineIndex = lines.findIndex(l => l.includes('-->'));
                if (timeLineIndex !== -1) {
                    const timeLine = lines[timeLineIndex];
                    const [startStr, endStr] = timeLine.split('-->').map(t => t.trim());
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
        });

        console.log(`Parsed ${parsed.length} subtitles`);
        setSubtitles(parsed);

        const saved = localStorage.getItem('subtitle-draft');
        if (saved) {
            try {
                const savedData = JSON.parse(saved);
                if (Array.isArray(savedData) && savedData.length === parsed.length) {
                    const merged = parsed.map((s, i) => ({
                        ...s,
                        translation: savedData[i].translation || ''
                    }));
                    setSubtitles(merged);
                }
            } catch (e) {
                console.error("Failed to load draft", e);
            }
        }
    }, []);

    useEffect(() => {
        if (subtitles.length > 0) {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = setTimeout(() => {
                localStorage.setItem('subtitle-draft', JSON.stringify(subtitles));
            }, 1000);
        }
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [subtitles]);

    useEffect(() => {
        if (!videoRef.current) return;
        const foundIndex = subtitles.findIndex(s => currentTime >= s.start && currentTime <= s.end);
        if (foundIndex !== -1 && foundIndex !== activeIndex) {
            setActiveIndex(foundIndex);
        }
    }, [currentTime, subtitles, activeIndex]);

    useEffect(() => {
        if (activeIndex >= 0 && activeIndex < subtitles.length) {
            const el = document.getElementById(`sub-${activeIndex}`);
            if (el && listRef.current) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            if (inputRef.current) {
                const currentTranslation = subtitles[activeIndex].translation;
                inputRef.current.value = currentTranslation;
                setPreviewText(currentTranslation);
                setTimeout(() => inputRef.current?.focus(), 50);
            }
        }
    }, [activeIndex, subtitles]);

    const handleTimeUpdate = useCallback(() => {
        if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
    }, []);

    const jumpToSubtitle = useCallback((index: number) => {
        if (index >= 0 && index < subtitles.length) {
            if (videoRef.current) videoRef.current.currentTime = subtitles[index].start;
            setActiveIndex(index);
        }
    }, [subtitles]);

    const handleSaveInput = useCallback(() => {
        if (activeIndex === -1 || !inputRef.current) return;
        const newTranslation = inputRef.current.value;
        setSubtitles(prev => {
            const newSubs = [...prev];
            newSubs[activeIndex] = { ...newSubs[activeIndex], translation: newTranslation };
            return newSubs;
        });
    }, [activeIndex]);

    // Debounced preview update to prevent lag
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        if (previewTimeoutRef.current) {
            clearTimeout(previewTimeoutRef.current);
        }

        previewTimeoutRef.current = setTimeout(() => {
            setPreviewText(value);
        }, 150); // 150ms debounce
    }, []);

    const handleEnterKey = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();

            // Clear debounce and update immediately
            if (previewTimeoutRef.current) {
                clearTimeout(previewTimeoutRef.current);
            }
            if (inputRef.current) {
                setPreviewText(inputRef.current.value);
            }

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
        let content = '';
        subtitles.forEach((s, i) => {
            content += `${i + 1}\n${formatTime(s.start)} --> ${formatTime(s.end)}\n${s.translation || ''}\n\n`;
        });
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'subtitle_sinhala.srt';
        a.click();
    }, [subtitles]);

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
                                        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                                        onTimeUpdate={handleTimeUpdate}
                                        onPlay={() => setIsPlaying(true)}
                                        onPause={() => setIsPlaying(false)}
                                        onClick={() => {
                                            if (videoRef.current) {
                                                videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
                                            }
                                        }}
                                    />
                                ) : (
                                    <div className="text-muted-foreground/30 flex flex-col items-center">
                                        <FileUp className="w-20 h-20 mb-6 opacity-10" />
                                        <p className="font-light tracking-wide">Drop a video here to start</p>
                                    </div>
                                )}

                                {/* Real-time Preview */}
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
                                    value={[currentTime]}
                                    max={duration || 100}
                                    step={0.1}
                                    onValueChange={(vals) => {
                                        const newTime = vals[0];
                                        setCurrentTime(newTime);
                                        if (videoRef.current) videoRef.current.currentTime = newTime;
                                    }}
                                    className="cursor-pointer py-2"
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 bg-black/20 p-1 rounded-lg border border-white/5">
                                    <Button size="icon" variant="ghost" className="w-8 h-8 rounded-md hover:bg-white/10" onClick={() => {
                                        if (videoRef.current) videoRef.current.currentTime -= 5;
                                    }}>
                                        <span className="text-[10px] font-bold">-5s</span>
                                    </Button>
                                    <Button
                                        size="icon"
                                        className="h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                                        onClick={() => {
                                            if (videoRef.current) {
                                                videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
                                            }
                                        }}
                                    >
                                        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                                    </Button>
                                    <Button size="icon" variant="ghost" className="w-8 h-8 rounded-md hover:bg-white/10" onClick={() => {
                                        if (videoRef.current) videoRef.current.currentTime += 5;
                                    }}>
                                        <span className="text-[10px] font-bold">+5s</span>
                                    </Button>
                                </div>

                                <div className="text-sm font-mono font-medium text-muted-foreground bg-black/20 px-3 py-1.5 rounded-md border border-white/5">
                                    {formatTime(currentTime).split(',')[0]} <span className="text-muted-foreground/40 mx-1">/</span> {videoRef.current ? formatTime(videoRef.current.duration || 0).split(',')[0] : '00:00:00'}
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
                                    {/* Original Subtitle - Above Input */}
                                    <div className="bg-black/20 rounded-xl border border-white/5 px-4 py-3">
                                        <div className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider font-bold opacity-60">Original</div>
                                        <p className="text-sm font-medium leading-relaxed text-muted-foreground/90">
                                            {stripHtmlTags(subtitles[activeIndex].text)}
                                        </p>
                                    </div>

                                    {/* Translation Input */}
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
                                {subtitles.map((sub, idx) => (
                                    <SubtitleListItem
                                        key={sub.id}
                                        sub={sub}
                                        idx={idx}
                                        activeIndex={activeIndex}
                                        previewText={previewText}
                                        onJump={jumpToSubtitle}
                                    />
                                ))}
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
