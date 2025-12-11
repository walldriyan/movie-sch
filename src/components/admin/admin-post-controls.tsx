'use client';

import { useState, useTransition } from 'react';
import { updatePostStatus } from '@/lib/actions/posts/update';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AdminPostControlsProps {
    postId: number;
    currentStatus: string;
    currentUserRole?: string;
    className?: string;
}

const STATUS_OPTIONS = [
    { value: 'PUBLISHED', label: 'Published', color: 'bg-green-500' },
    { value: 'PENDING_APPROVAL', label: 'Pending Approval', color: 'bg-yellow-500' },
    { value: 'DRAFT', label: 'Draft', color: 'bg-slate-500' },
    { value: 'REJECTED', label: 'Rejected', color: 'bg-red-500' },
    { value: 'PRIVATE', label: 'Private', color: 'bg-blue-500' },
];

export default function AdminPostControls({ postId, currentStatus, currentUserRole, className }: AdminPostControlsProps) {
    if (currentUserRole !== 'SUPER_ADMIN') return null;

    const [status, setStatus] = useState(currentStatus);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

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

    return (
        <Card className={`bg-[#111112] border-red-500/20 shadow-lg mt-8 overflow-hidden ${className}`}>
            <div className="h-1 bg-gradient-to-r from-red-500 to-orange-500" />
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-red-500/10 border border-red-500/20 text-red-500">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                Admin Controls
                                <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-red-500/50 text-red-500">SUPER ADMIN</Badge>
                            </h3>
                            <p className="text-sm text-muted-foreground">Manage visibility and approval status.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto bg-black/20 p-2 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2 px-3">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status:</span>
                        </div>
                        <Select value={status} onValueChange={handleStatusUpdate} disabled={isPending}>
                            <SelectTrigger className="w-[180px] bg-white/5 border-white/10 h-10">
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
                        {isPending && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground ml-2" />}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
