
'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, Video, Subtitles, Play, Pause, Rewind, FastForward, SkipBack, SkipForward, Save } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

// This is a placeholder for the future IndexedDB integration
const db = {
    getSubtitles: async () => [],
    addSubtitle: async (sub: any) => {},
    updateSubtitleText: async (id: number, text: string) => {},
};

// This is a placeholder for a subtitle parsing utility
const parseSrt = (srtContent: string) => {
    return srtContent.split('\n\n').map(block => {
        const lines = block.split('\n');
        return {
            id: parseInt(lines[0], 10),
            time: lines[1],
            text: lines.slice(2).join('\n'),
        };
    });
};

export default function SubtitleEditorPage() {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [subtitles, setSubtitles] = useState<any[]>([]);
    const [playing, setPlaying] = useState(false);
    const [played, setPlayed] = useState(0);
    const [duration, setDuration] = useState(0);
    const playerRef = useRef<ReactPlayer>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const subtitleInputRef = useRef<HTMLInputElement>(null);
    
    const handleVideoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setVideoFile(file);
            const url = URL.createObjectURL(file);
            setVideoUrl(url);
        }
    };
    
    const handleSubtitleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                const parsedSubs = parseSrt(content);
                setSubtitles(parsedSubs);
                // In a real implementation, you would add these to IndexedDB
            };
            reader.readAsText(file);
        }
    };

    const handleSeekChange = (value: number[]) => {
        setPlayed(value[0]);
        playerRef.current?.seekTo(value[0], 'fraction');
    };
    
    const handleSeekStep = (direction: 'forward' | 'backward') => {
        const currentTime = playerRef.current?.getCurrentTime() || 0;
        const newTime = direction === 'forward' ? currentTime + 5 : currentTime - 5;
        playerRef.current?.seekTo(newTime);
    };
    
    const handleNextPrevSubtitle = (direction: 'next' | 'prev') => {
        const currentTime = playerRef.current?.getCurrentTime() || 0;
        // This is a placeholder logic. Real logic would find the next/prev sub from IndexedDB.
        console.log(`Seeking to ${direction} subtitle from ${currentTime}`);
    };

    return (
        <main className="flex-1 p-4 md:p-8 pt-6 space-y-6">
            <h1 className="text-3xl font-bold">Subtitle Editor</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-10rem)]">
                {/* Left Column: Video Player */}
                <div className="flex flex-col gap-4">
                     <Card className="aspect-video relative bg-black flex-grow">
                        {videoUrl ? (
                            <ReactPlayer
                                ref={playerRef}
                                url={videoUrl}
                                width="100%"
                                height="100%"
                                playing={playing}
                                onProgress={(state) => setPlayed(state.played)}
                                onDuration={setDuration}
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted rounded-lg">
                                <Video className="w-16 h-16 mb-4" />
                                <p>Select a video file to begin</p>
                            </div>
                        )}
                    </Card>
                    <div className="space-y-4">
                        <Slider
                            value={[played]}
                            onValueChange={handleSeekChange}
                            max={1}
                            step={0.001}
                        />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleSeekStep('backward')}><Rewind className="w-5 h-5" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => setPlaying(!playing)}>
                                    {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleSeekStep('forward')}><FastForward className="w-5 h-5" /></Button>
                            </div>
                            <div className="flex items-center gap-4">
                                <Button variant="outline" size="sm" onClick={() => handleNextPrevSubtitle('prev')}>
                                    <SkipBack className="w-4 h-4 mr-2" /> Prev
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleNextPrevSubtitle('next')}>
                                    Next <SkipForward className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                            <div className="text-sm font-mono">
                                <span>{new Date(played * duration * 1000).toISOString().substr(14, 5)}</span>
                                /
                                <span>{new Date(duration * 1000).toISOString().substr(14, 5)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Subtitle Editor */}
                <Card className="flex flex-col h-full">
                    <CardHeader>
                        <CardTitle>Editor</CardTitle>
                         <CardDescription>Load a video and subtitle file to start editing.</CardDescription>
                         <div className="flex gap-4 pt-2">
                           <Button variant="outline" onClick={() => videoInputRef.current?.click()} className="w-full">
                                <Upload className="w-4 h-4 mr-2"/> Select Video
                            </Button>
                             <Button variant="outline" onClick={() => subtitleInputRef.current?.click()} className="w-full">
                                <Subtitles className="w-4 h-4 mr-2"/> Select Subtitle File
                            </Button>
                            <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoFileChange} />
                            <input ref={subtitleInputRef} type="file" accept=".srt" className="hidden" onChange={handleSubtitleFileChange} />
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow overflow-hidden">
                        <ScrollArea className="h-full">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-1/4">Time</TableHead>
                                        <TableHead>English</TableHead>
                                        <TableHead>Sinhala</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {subtitles.length > 0 ? subtitles.map(sub => (
                                        <TableRow key={sub.id}>
                                            <TableCell className="font-mono text-xs">{sub.time}</TableCell>
                                            <TableCell className="text-sm">{sub.text}</TableCell>
                                            <TableCell>
                                                <Input type="text" placeholder="Enter Sinhala translation..." className="bg-transparent border-0 focus-visible:ring-1"/>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center h-24">
                                                No subtitles loaded.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}

