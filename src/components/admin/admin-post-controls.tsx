'use client';

import { useState, useTransition, useEffect } from 'react';
import { updatePostStatus, updatePostLockSettings } from '@/lib/actions/posts/update';
import { getExamsForAdmin, assignExamToPost } from '@/lib/actions/exams';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck, Lock, Unlock, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface AdminPostControlsProps {
    postId: number;
    currentStatus: string;
    currentUserRole?: string;
    className?: string;
    isLocked?: boolean;
    hasExam?: boolean;
    currentExamId?: number;
}

const STATUS_OPTIONS = [
    { value: 'PUBLISHED', label: 'Published', color: 'bg-green-500' },
    { value: 'PENDING_APPROVAL', label: 'Pending Approval', color: 'bg-yellow-500' },
    { value: 'DRAFT', label: 'Draft', color: 'bg-slate-500' },
    { value: 'REJECTED', label: 'Rejected', color: 'bg-red-500' },
    { value: 'PRIVATE', label: 'Private', color: 'bg-blue-500' },
];

export default function AdminPostControls({
    postId,
    currentStatus,
    currentUserRole,
    className,
    isLocked = false,
    hasExam = false,
    currentExamId = undefined
}: AdminPostControlsProps) {
    const [status, setStatus] = useState(currentStatus);
    const [locked, setLocked] = useState(isLocked);
    const [exam, setExam] = useState(hasExam);
    const [selectedExamId, setSelectedExamId] = useState<string>(currentExamId ? String(currentExamId) : 'none');
    const [availableExams, setAvailableExams] = useState<any[]>([]);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    // Fetch exams on mount
    useEffect(() => {
        if (currentUserRole === 'SUPER_ADMIN') {
            getExamsForAdmin()
                .then((exams) => setAvailableExams(exams))
                .catch((err) => console.error("Failed to fetch exams", err));
        }
    }, [currentUserRole]);

    // Update local state if props change (e.g. after revalidation)
    useEffect(() => {
        setLocked(isLocked);
        setExam(hasExam);
        setSelectedExamId(currentExamId ? String(currentExamId) : 'none');
    }, [isLocked, hasExam, currentExamId]);

    if (currentUserRole !== 'SUPER_ADMIN') return null;

    const handleStatusUpdate = (newStatus: string) => {
        const prevStatus = status;
        setStatus(newStatus);

        startTransition(async () => {
            try {
                await updatePostStatus(postId, newStatus);
                toast({
                    title: "Status Updated",
                    description: `Post status changed to ${newStatus}`,
                });
            } catch (error) {
                console.error(error);
                toast({
                    title: "Error",
                    description: "Failed to update status",
                    variant: "destructive"
                });
                setStatus(prevStatus);
            }
        });
    }

    const handleLockSettingsChange = (newLocked: boolean, newExam: boolean) => {
        setLocked(newLocked);
        setExam(newExam);

        startTransition(async () => {
            try {
                await updatePostLockSettings(postId, newLocked, newExam);
                toast({
                    title: "Settings Updated",
                    description: "Lock and Exam settings updated.",
                });
            } catch (error) {
                console.error(error);
                toast({
                    variant: "destructive",
                    title: "Update Failed",
                    description: "Could not update settings."
                });
                // Revert
                setLocked(isLocked);
                setExam(hasExam);
            }
        });
    };

    const handleExamAssign = (value: string) => {
        const newExamId = value === 'none' ? null : parseInt(value);
        setSelectedExamId(value);

        startTransition(async () => {
            try {
                await assignExamToPost(postId, newExamId);
                toast({
                    title: "Exam Updated",
                    description: newExamId ? "Exam linked successfully." : "Exam unlinked.",
                });
                // If unlinking, maybe auto-disable exam requirement?
                if (!newExamId && exam) {
                    handleLockSettingsChange(locked, false);
                }
            } catch (error) {
                console.error(error);
                toast({
                    variant: "destructive",
                    title: "Update Failed",
                    description: "Could not update exam link."
                });
                setSelectedExamId(currentExamId ? String(currentExamId) : 'none');
            }
        });
    };

    return (
        <Card className={`bg-[#111112] border-red-500/20 shadow-lg mt-8 overflow-hidden ${className}`}>
            <div className="h-1 bg-gradient-to-r from-red-500 to-orange-500" />
            <CardContent className="p-6">
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-red-500/10 border border-red-500/20 text-red-500">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                Admin Controls
                                <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-red-500/50 text-red-500">SUPER ADMIN</Badge>
                            </h3>
                            <p className="text-sm text-muted-foreground">Manage visibility and access control.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                        {/* Status Select */}
                        <div className="flex items-center justify-between gap-3 bg-black/20 p-2 rounded-xl border border-white/5 pr-2">
                            <div className="flex items-center gap-2 px-3">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status:</span>
                            </div>
                            <Select value={status} onValueChange={handleStatusUpdate} disabled={isPending}>
                                <SelectTrigger className="w-[160px] bg-white/5 border-white/10 h-10">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#111112] border-white/10">
                                    {STATUS_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${opt.color}`} />
                                                {opt.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Lock / Exam Settings */}
                        <div className="flex flex-col gap-3">
                            {/* Content Lock Switch */}
                            <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                                <div className="flex items-center gap-2">
                                    {locked ? <Lock className="w-4 h-4 text-amber-500" /> : <Unlock className="w-4 h-4 text-green-500" />}
                                    <Label htmlFor="lock-toggle" className="text-sm font-medium">Content Locked</Label>
                                </div>
                                <Switch
                                    id="lock-toggle"
                                    checked={locked}
                                    onCheckedChange={(checked) => handleLockSettingsChange(checked, exam)}
                                    disabled={isPending}
                                />
                            </div>

                            {/* Exam Selector & Toggle */}
                            <div className="space-y-3 p-3 bg-black/20 rounded-xl border border-white/5">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-primary" />
                                            <Label htmlFor="exam-select" className="text-sm font-medium">Linked Exam</Label>
                                        </div>
                                    </div>
                                    <Select value={selectedExamId} onValueChange={handleExamAssign} disabled={isPending}>
                                        <SelectTrigger className="w-full bg-white/5 border-white/10 h-9 text-xs">
                                            <SelectValue placeholder="Select an exam..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#111112] border-white/10 max-h-[200px]">
                                            <SelectItem value="none">No Exam Linked</SelectItem>
                                            {availableExams.map((ex) => (
                                                <SelectItem key={ex.id} value={String(ex.id)}>
                                                    #{ex.id} - {ex.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="exam-toggle" className={`text-sm font-medium ${selectedExamId === 'none' ? 'text-muted-foreground' : ''}`}>Exam Required</Label>
                                    </div>
                                    <Switch
                                        id="exam-toggle"
                                        checked={exam}
                                        onCheckedChange={(checked) => handleLockSettingsChange(locked, checked)}
                                        disabled={isPending || selectedExamId === 'none'}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    {isPending && <div className="flex items-center justify-center text-xs text-muted-foreground"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Saving changes...</div>}
                </div>
            </CardContent>
        </Card>
    );
}
