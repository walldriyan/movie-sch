'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactPlayer from 'react-player';
import { openDB, IDBPDatabase } from 'idb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, Video, Subtitles, Play, Pause, Rewind, FastForward, SkipBack, SkipForward, Save, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';


// --- Database Setup ---
const DB_NAME = 'subtitle-editor-db';
const DB_VERSION = 1;
const SUBTITLE_STORE = 'subtitles';

let dbPromise: Promise<IDBPDatabase> | null = null;

if (typeof window !== 'undefined') {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(SUBTITLE_STORE)) {
                const store = db.createObjectStore(SUBTITLE_STORE, { keyPath: 'id', autoIncrement: true });
                store.createIndex('startTime', 'startTime', { unique: false });
            }
        },
    });
}

// --- Subtitle Parsing Logic ---
interface SubtitleEntry {
    id: number;
    startTime: number;
    endTime: number;
    english: string;
    sinhala?: string;
}

const timeToSeconds = (time: string): number => {
    const [h, m, s] = time.replace(',', '.').split(':').map(parseFloat);
    return h * 3600 + m * 60 + s;
};

const secondsToSrtTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return '00:00:00,000';
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toFixed(3).replace('.', ',').padStart(6, '0');
    return `${h}:${m}:${s}`;
}


const parseSrt = (srtContent: string): Omit<SubtitleEntry, 'id'>[] => {
    console.log("--- [SRT Parser] පියවර 1: SRT ගොනුව parse කිරීම ආරම්භ විය.");
    const blocks = srtContent.trim().split(/\r?\n\r?\n/);
    const parsed = blocks.map((block): Omit<SubtitleEntry, 'id'> | null => {
        const lines = block.split(/\r?\n/);
        if (lines.length < 3) return null;
        const timeMatch = lines[1]?.match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);
        if (!timeMatch) return null;

        return {
            startTime: timeToSeconds(timeMatch[1]),
            endTime: timeToSeconds(timeMatch[2]),
            english: lines.slice(2).join('\n'),
            sinhala: '',
        };
    }).filter((s): s is Omit<SubtitleEntry, 'id'> => s !== null);
    console.log(`--- [SRT Parser] පියවර 2: Subtitle lines ${parsed.length} ක් සාර්ථකව parse කරන ලදී.`);
    return parsed;
};


export default function SubtitleEditorPage() {
    console.log("--- [Editor Page] Component එක render වීම ආරම්භ විය.");
    const { toast } = useToast();
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [subtitles, setSubtitles] = useState<SubtitleEntry[]>([]);
    const [playing, setPlaying] = useState(false);
    const [played, setPlayed] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [currentSubtitle, setCurrentSubtitle] = useState<SubtitleEntry | null>(null);

    // PERFORMANCE FIX: Local input values - මේවා render trigger කරන්නේ නැහැ!
    const inputValuesRef = useRef<Map<number, string>>(new Map());

    // States for debug overlay
    const [isBuffering, setIsBuffering] = useState(false);
    const [bufferedAmount, setBufferedAmount] = useState(0);

    // Fix 2: Enter key processing flag එකක් add කරමු
    const isProcessingEnter = useRef(false);

    // CRITICAL FIX: Manual subtitle change tracking
    const manualSubtitleChangeRef = useRef(false);
    const manualSubtitleTimerRef = useRef<NodeJS.Timeout | null>(null);

    // PERFORMANCE: Debounce timer for auto-save
    const saveTimerRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

    const playerRef = useRef<ReactPlayer>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const subtitleInputRef = useRef<HTMLInputElement>(null);
    const activeRowRef = useRef<HTMLTableRowElement>(null);
    const overlayInputRef = useRef<HTMLInputElement>(null);


    const loadSubtitlesFromDB = async () => {
        console.log("--- [DB] IndexedDB වෙතින් subtitles load කිරීම ආරම්භ විය.");
        if (!dbPromise) return;
        const db = await dbPromise;
        const tx = db.transaction(SUBTITLE_STORE, 'readonly');
        const allSubs = await tx.store.getAll();
        setSubtitles(allSubs);

        // Load existing values into ref
        const valueMap = new Map<number, string>();
        allSubs.forEach(sub => {
            if (sub.sinhala) valueMap.set(sub.id, sub.sinhala);
        });
        inputValuesRef.current = valueMap;

        console.log(`--- [DB] Subtitles ${allSubs.length} ක් DB එකෙන් load කරන ලදී. State යාවත්කාලීන විය.`);
    };

    useEffect(() => {
        console.log("--- [useEffect] පළමු render එකෙන් පසු subtitles load කිරීමේ effect එක ක්‍රියාත්මක විය.");
        loadSubtitlesFromDB();
    }, []);

    useEffect(() => {
        if (activeRowRef.current) {
            console.log(`--- [useEffect] Active subtitle (ID: ${currentSubtitle?.id}) වෙනස් විය. අදාළ row එක scroll කරමින් පවතී.`);
            activeRowRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [currentSubtitle]);

    const handleVideoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        console.log("--- [File Handling] Video ගොනුවක් තෝරාගෙන ඇත.");
        const file = event.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setVideoUrl(url);
            setPlayed(0);
            setCurrentTime(0);
            console.log(`--- [File Handling] Video URL එක state එකට set කරන ලදී: ${url}`);
        }
    };

    const handleSubtitleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        console.log("--- [File Handling] Subtitle ගොනුවක් තෝරාගෙන ඇත.");
        const file = event.target.files?.[0];
        if (file && dbPromise) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const content = e.target?.result as string;
                const parsedSubs = parseSrt(content);

                console.log("--- [DB] පැරණි subtitles clear කරමින්, අලුත් ඒවා DB එකට add කරමින් පවතී.");
                const db = await dbPromise!;
                const tx = db.transaction(SUBTITLE_STORE, 'readwrite');
                await tx.store.clear();
                for (const sub of parsedSubs) {
                    await tx.store.add(sub as any);
                }
                await tx.done;

                await loadSubtitlesFromDB();
                inputValuesRef.current.clear();
                toast({ title: 'Subtitles Loaded', description: `${parsedSubs.length} lines loaded into the editor.` })
            };
            reader.readAsText(file);
        }
    };

    // PERFORMANCE FIX: Debounced save - save කිරීම Enter button එකට පමණක්
    const saveChanges = async (id: number, text: string) => {
        console.log(`--- [Save] saveChanges function එක ක්‍රියාත්මක විය. ID: ${id}, Text: "${text}"`);
        if (dbPromise) {
            const db = await dbPromise;
            const existingSub = await db.get(SUBTITLE_STORE, id);
            if (existingSub) {
                console.log(`--- [Save] DB එකේ ID: ${id} සොයා ගන්නා ලදී. Sinhala text එක update කරමින් පවතී.`);
                await db.put(SUBTITLE_STORE, { ...existingSub, sinhala: text });
                console.log(`--- [Save] DB එක සාර්ථකව update කරන ලදී.`);
            } else {
                console.warn(`--- [Save] DB එකේ ID: ${id} සොයා ගැනීමට නොහැකි විය.`);
            }

            console.log(`--- [Save] Optimistic UI: ප්‍රධාන 'subtitles' state එක update කරමින් පවතී.`);
            setSubtitles(prevSubs => prevSubs.map(s => s.id === id ? { ...s, sinhala: text } : s));
            console.log(`--- [Save] Optimistic UI: State එක update කරන ලදී.`);
        }
    };

    // PERFORMANCE FIX: Input change - state update කරන්නේ නැහැ, ref එකේ පමණක් store කරනවා
    const handleSinhalaChange = useCallback((id: number, text: string) => {
        // Ref එකේ value එක update කරමු - මේක render trigger කරන්නේ නැහැ!
        inputValuesRef.current.set(id, text);

        // Input element එකම directly update කරමු (React re-render නැතිව)
        const overlayInput = document.getElementById(`overlay-input-${id}`) as HTMLInputElement;
        const tableInput = document.getElementById(`sub-input-${id}`) as HTMLInputElement;

        if (overlayInput && overlayInput !== document.activeElement) {
            overlayInput.value = text;
        }
        if (tableInput && tableInput !== document.activeElement) {
            tableInput.value = text;
        }
    }, []);

    // Fix handleKeyDown - Enter button එකට පමණක් save කරනවා
    const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            if (isProcessingEnter.current) {
                console.log("--- [Input Event] 'Enter': දැනට ම process වෙමින් පවතී, ignore කරමින් පවතී.");
                e.preventDefault();
                return;
            }

            e.preventDefault();
            isProcessingEnter.current = true;
            console.log("--- [Input Event] 'Enter' key එක press කරන ලදී.");

            const currentTarget = e.target as HTMLInputElement;
            const idMatch = currentTarget.id.match(/\d+/);

            if (!idMatch) {
                console.warn("--- [Input Event] 'Enter': Input ID එක සොයා ගැනීමට නොහැකි විය.");
                isProcessingEnter.current = false;
                return;
            }

            const idAsNum = parseInt(idMatch[0], 10);
            const currentText = currentTarget.value;

            console.log(`--- [Input Event] 'Enter': ID: ${idAsNum}, Text: "${currentText}" save කිරීම ආරම්භ විය.`);

            try {
                // Save කරමු
                await saveChanges(idAsNum, currentText);
                console.log("--- [Input Event] 'Enter': Save කිරීම අවසන්. ඊළඟ subtitle එකට jump වීමට සූදානම්.");

                // Ref වලින් clear කරමු
                inputValuesRef.current.delete(idAsNum);

                const currentIndex = subtitles.findIndex(s => s.id === idAsNum);
                const nextSub = subtitles[currentIndex + 1];

                if (nextSub) {
                    console.log(`--- [Input Event] 'Enter': ඊළඟ subtitle (ID: ${nextSub.id}) එක හමු විය. Player එක ${nextSub.startTime} තත්පරයට seek කරමින් පවතී.`);

                    setPlaying(false);

                    // CRITICAL FIX: Progress callback එක ignore කරන්න flag එක set කරමු
                    manualSubtitleChangeRef.current = true;

                    // පැරණි timer එක clear කරමු
                    if (manualSubtitleTimerRef.current) {
                        clearTimeout(manualSubtitleTimerRef.current);
                    }

                    // Subtitle එක set කර seek කරමු
                    setCurrentSubtitle(nextSub);
                    playerRef.current?.seekTo(nextSub.startTime);

                    // 500ms යන තුරු progress updates ignore කරමු (video seek complete වෙන්න)
                    manualSubtitleTimerRef.current = setTimeout(() => {
                        manualSubtitleChangeRef.current = false;
                        console.log("--- [Input Event] Manual subtitle change flag එක reset විය.");
                    }, 500);

                    // Focus එක සකසමු
                    setTimeout(() => {
                        if (overlayInputRef.current) {
                            overlayInputRef.current.focus();
                            overlayInputRef.current.select();
                        }
                    }, 100);
                } else {
                    console.log("--- [Input Event] 'Enter': ඊළඟ subtitle එකක් නොමැත.");
                }
            } finally {
                setTimeout(() => {
                    isProcessingEnter.current = false;
                    console.log("--- [Input Event] 'Enter' processing flag එක reset විය.");
                }, 300);
            }
        }
    };

    // Fix 6: handleProgress එක optimize කරමු - අනවශ්‍ය re-renders නතර කිරීමට
    const handleProgress = useCallback((state: { played: number; playedSeconds: number; loadedSeconds: number }) => {
        setPlayed(state.played);
        setCurrentTime(state.playedSeconds);
        setBufferedAmount(state.loadedSeconds);

        // CRITICAL FIX: Manual subtitle change කරලා තිබ්බොත් progress callback එක ignore කරමු
        if (manualSubtitleChangeRef.current) {
            return; // Progress updates ignore කරනවා seek එක complete වෙනකම්
        }

        const activeSub = subtitles.find(s => state.playedSeconds >= s.startTime && state.playedSeconds <= s.endTime);

        if (activeSub?.id !== currentSubtitle?.id) {
            console.log(`--- [Progress] Active subtitle වෙනස් විය: ${activeSub?.id || 'none'}`);
            setCurrentSubtitle(activeSub || null);
        }
    }, [subtitles, currentSubtitle]);

    const handleSeekChange = (value: number[]) => {
        const newPlayed = value[0];
        setPlayed(newPlayed);
        playerRef.current?.seekTo(newPlayed, 'fraction');
        console.log(`--- [Player Control] Slider එක මගින් video එක ${Math.round(newPlayed * 100)}% වෙත seek කරන ලදී.`);
    };

    const handleSeekStep = (seconds: number) => {
        const newTime = (playerRef.current?.getCurrentTime() || 0) + seconds;
        playerRef.current?.seekTo(newTime);
        console.log(`--- [Player Control] Video එක තත්පර ${seconds} කින් ${seconds > 0 ? 'ඉදිරියට' : 'පිටුපසට'} seek කරන ලදී.`);
    };

    const handleSubtitleJump = (direction: 'next' | 'prev') => {
        console.log(`--- [Player Control] '${direction}' subtitle jump button එක click කරන ලදී.`);
        setPlaying(false);
        const time = playerRef.current?.getCurrentTime() || currentTime;
        console.log(`--- [Player Control] Jump: දැනට පවතින වේලාව: ${time}`);

        // CRITICAL FIX: වේලාව භාවිතා කර current subtitle index එක නිවැරදිව හඳුනා ගනිමු
        // සරල logic: වේලාව >= startTime වන අන්තිම subtitle එක තෝරන්න
        let currentIndex = -1;

        for (let i = subtitles.length - 1; i >= 0; i--) {
            if (time >= subtitles[i].startTime) {
                currentIndex = i;
                break;
            }
        }

        console.log(`--- [Player Control] Jump: Current index: ${currentIndex}, Subtitle: ${currentIndex >= 0 ? subtitles[currentIndex].id : 'none'}`);

        let targetSub: SubtitleEntry | undefined;

        if (direction === 'next') {
            if (currentIndex >= 0 && currentIndex < subtitles.length - 1) {
                targetSub = subtitles[currentIndex + 1];
            } else if (currentIndex < 0) {
                targetSub = subtitles[0];
            } else {
                console.log(`--- [Player Control] Jump: අන්තිම subtitle එකේ ඉන්නවා. ඊළඟ එකක් නැහැ.`);
            }
        } else {
            const currentSub = currentIndex >= 0 ? subtitles[currentIndex] : null;
            if (currentSub && time > currentSub.startTime + 1) {
                targetSub = currentSub;
            } else if (currentIndex > 0) {
                targetSub = subtitles[currentIndex - 1];
            } else if (currentIndex === 0) {
                targetSub = subtitles[0];
            } else {
                targetSub = subtitles[0];
            }
        }

        if (targetSub) {
            const targetIndex = subtitles.findIndex(s => s.id === targetSub!.id);
            console.log(`--- [Player Control] Jump: ඉලක්ක subtitle එක (ID: ${targetSub.id}, Index: ${targetIndex}) හමු විය. Player එක ${targetSub.startTime} තත්පරයට seek කරමින් පවතී.`);

            // CRITICAL FIX: Manual jump වෙලාත් progress ignore කරමු
            manualSubtitleChangeRef.current = true;

            if (manualSubtitleTimerRef.current) {
                clearTimeout(manualSubtitleTimerRef.current);
            }

            setCurrentSubtitle(targetSub);
            playerRef.current?.seekTo(targetSub.startTime);

            manualSubtitleTimerRef.current = setTimeout(() => {
                manualSubtitleChangeRef.current = false;
                console.log("--- [Jump] Manual subtitle change flag එක reset විය.");
            }, 500);

            setTimeout(() => {
                if (overlayInputRef.current) {
                    overlayInputRef.current.focus();
                    overlayInputRef.current.select();
                }
            }, 100);
        } else {
            console.log(`--- [Player Control] Jump: ඉලක්ක subtitle එකක් හමු නොවීය. (${direction === 'next' ? 'End of video' : 'Start of video'})`);
            toast({
                variant: "destructive",
                title: "Navigation Limit",
                description: `You are at the ${direction === 'next' ? 'last' : 'first'} subtitle.`,
            });
        }
    };


    const handleRowClick = (startTime: number) => {
        console.log(`--- [UI Event] Subtitle row එකක් click කරන ලදී. Player එක ${startTime} තත්පරයට seek කරමින් පවතී.`);
        playerRef.current?.seekTo(startTime);
        setPlaying(false);
    }

    const handleSave = () => {
        console.log("--- [File Handling] 'Save Sinhala SRT' button එක click කරන ලදී.");
        let srtContent = '';
        subtitles.forEach((sub, index) => {
            srtContent += `${index + 1}\n`;
            srtContent += `${secondsToSrtTime(sub.startTime)} --> ${secondsToSrtTime(sub.endTime)}\n`;
            srtContent += `${sub.sinhala || ''}\n\n`;
        });

        const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sinhala_subtitles.srt';
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: 'File Saved', description: 'Your Sinhala subtitle file has been downloaded.' });
        console.log("--- [File Handling] SRT ගොනුව සාර්ථකව generate කර download කරන ලදී.");
    };

    // Helper function - input value එක get කිරීමට
    const getInputValue = (sub: SubtitleEntry) => {
        return inputValuesRef.current.get(sub.id) ?? sub.sinhala ?? '';
    };

    return (
        <main className="max-w-7xl mx-auto p-4 md:p-8 pt-6 space-y-6">
            <h1 className="text-3xl font-bold">Subtitle Editor</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-1 flex flex-col gap-4">
                    <div className="aspect-video relative bg-black flex-grow rounded-lg overflow-hidden">
                        <div className="absolute top-2 left-2 z-20 bg-black/50 text-white text-xs font-mono p-2 rounded-lg pointer-events-none">
                            <h4 className="font-bold mb-1 flex items-center gap-2"><Info className="w-4 h-4" />Debug Info</h4>
                            <p>Duration: {secondsToSrtTime(duration)}</p>
                            <p>Current: {secondsToSrtTime(currentTime)}</p>
                            <p>Buffered: {secondsToSrtTime(bufferedAmount)}</p>
                            <p>Buffering: {isBuffering ? 'Yes' : 'No'}</p>
                        </div>
                        {videoUrl ? (
                            <ReactPlayer
                                ref={playerRef}
                                url={videoUrl}
                                width="100%"
                                height="100%"
                                playing={playing}
                                onProgress={handleProgress}
                                onDuration={(d) => { console.log(`--- [Player Event] Video duration එක ලැබුණි: ${d}`); setDuration(d); }}
                                onBuffer={() => { console.log("--- [Player Event] Video එක buffer වෙමින් පවතී..."); setIsBuffering(true); }}
                                onBufferEnd={() => { console.log("--- [Player Event] Buffering අවසන්."); setIsBuffering(false); }}
                                onPlay={() => console.log("--- [Player Event] Video එක play විය.")}
                                onPause={() => console.log("--- [Player Event] Video එක pause විය.")}
                                onSeek={(seconds) => console.log(`--- [Player Event] Video එක ${seconds} තත්පරයට seek කරන ලදී.`)}
                                controls={false}
                                progressInterval={100}
                                config={{
                                    file: {
                                        forceVideo: true,
                                        attributes: {
                                            preload: 'auto',
                                        }
                                    }
                                }}
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted">
                                <Video className="w-16 h-16 mb-4" />
                                <p>Select a video file to begin</p>
                            </div>
                        )}
                        {currentSubtitle && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 text-center pointer-events-none space-y-2">
                                <p className="py-1 px-3 text-2xl font-semibold text-white bg-black/50 rounded" style={{ textShadow: '2px 2px 4px #000000' }}>
                                    {currentSubtitle.english}
                                </p>
                                <div className="pointer-events-auto">
                                    <Input
                                        ref={overlayInputRef}
                                        key={`overlay-${currentSubtitle.id}`}
                                        id={`overlay-input-${currentSubtitle.id}`}
                                        type="text"
                                        placeholder="Enter Sinhala translation..."
                                        className="bg-black/50 border-primary/50 text-yellow-300 text-center text-2xl font-semibold focus-visible:ring-primary h-auto p-2"
                                        style={{ textShadow: '2px 2px 4px #000000' }}
                                        defaultValue={getInputValue(currentSubtitle)}
                                        onChange={(e) => handleSinhalaChange(currentSubtitle.id, e.target.value)}
                                        onKeyDown={handleKeyDown}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="space-y-4 p-4 border rounded-lg bg-card">
                        <Slider
                            value={[played]}
                            onValueChange={handleSeekChange}
                            max={1}
                            step={0.001}
                        />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleSeekStep(-5)}><Rewind className="w-5 h-5" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => setPlaying(!playing)}>
                                    {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleSeekStep(5)}><FastForward className="w-5 h-5" /></Button>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleSubtitleJump('prev')}>
                                    <SkipBack className="w-4 h-4 mr-2" /> Prev Sub
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleSubtitleJump('next')}>
                                    Next Sub <SkipForward className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                            <div className="text-sm font-mono text-muted-foreground">
                                <span>{secondsToSrtTime(currentTime)}</span>
                                /
                                <span>{secondsToSrtTime(duration)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-1">
                    <Card className="flex flex-col h-[calc(100vh-12rem)]">
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                                <div>
                                    <CardTitle>Editor</CardTitle>
                                    <CardDescription>Load files, then click a row to seek video and start editing.</CardDescription>
                                </div>
                                <div className="flex flex-col gap-2 pt-2 flex-shrink-0">
                                    <Button variant="outline" onClick={() => videoInputRef.current?.click()}>
                                        <Upload className="w-4 h-4 mr-2" /> Select Video
                                    </Button>
                                    <Button variant="outline" onClick={() => subtitleInputRef.current?.click()}>
                                        <Subtitles className="w-4 h-4 mr-2" /> Select Subtitle File
                                    </Button>
                                    <Button onClick={handleSave} >
                                        <Save className="w-4 h-4 mr-2" /> Save Sinhala SRT
                                    </Button>
                                    <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoFileChange} />
                                    <input ref={subtitleInputRef} type="file" accept=".srt,.vtt" className="hidden" onChange={handleSubtitleFileChange} />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between mb-4 p-2 border-t">
                                <Button variant="outline" size="sm" onClick={() => handleSubtitleJump('prev')}>
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Prev Sub
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleSubtitleJump('next')}>
                                    Next Sub
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                            <ScrollArea className="h-full">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-card z-10">
                                        <TableRow>
                                            <TableHead className="w-[100px]">Time</TableHead>
                                            <TableHead>Subtitles</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {subtitles.length > 0 ? subtitles.map((sub) => (
                                            <TableRow
                                                key={sub.id}
                                                ref={currentSubtitle?.id === sub.id ? activeRowRef : null}
                                                onClick={() => handleRowClick(sub.startTime)}
                                                className={cn("cursor-pointer", currentSubtitle?.id === sub.id && 'bg-primary/10')}
                                            >
                                                <TableCell className="font-mono text-xs text-muted-foreground align-top pt-3">
                                                    {secondsToSrtTime(sub.startTime).split(',')[0]}
                                                </TableCell>
                                                <TableCell className="space-y-2 pr-4">
                                                    <p className="text-sm text-muted-foreground">{sub.english}</p>
                                                    <Input
                                                        key={`table-${sub.id}`}
                                                        id={`sub-input-${sub.id}`}
                                                        type="text"
                                                        placeholder="Enter Sinhala translation..."
                                                        className="bg-transparent border-0 border-b border-input rounded-none focus-visible:ring-0 focus-visible:border-primary text-base p-1 h-auto"
                                                        defaultValue={getInputValue(sub)}
                                                        onChange={(e) => handleSinhalaChange(sub.id, e.target.value)}
                                                        onKeyDown={handleKeyDown}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
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
            </div>
        </main>
    );
}