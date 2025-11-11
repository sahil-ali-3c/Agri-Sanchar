
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getGroup, addUserToGroup, type Group } from '@/lib/firebase/groups';
import { Spinner } from '@/components/ui/spinner';
import { Users, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useTranslation } from '@/hooks/use-translation';

type UserProfile = {
    farmerId: string;
    name: string;
    avatar: string;
};

export default function JoinGroupPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { t } = useTranslation();

    const [group, setGroup] = useState<Group | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const groupId = searchParams.get('group');

    useEffect(() => {
        const profile = localStorage.getItem("userProfile");
        if (profile) {
            setUserProfile(JSON.parse(profile));
        } else {
            // Redirect to login but pass the join link so they can come back
            const joinUrl = `/community/join?group=${groupId}`;
            router.push(`/login?redirect=${encodeURIComponent(joinUrl)}`);
            return;
        }

        if (groupId && typeof groupId === 'string') {
            const groupData = getGroup(groupId);
            if (groupData) {
                setGroup(groupData);
            } else {
                setError(t.community.join.invalidLink);
            }
        } else {
            setError(t.community.join.noGroupId);
        }
        setIsLoading(false);
    }, [groupId, router, t]);

    const handleJoinGroup = () => {
        if (!groupId || !userProfile || typeof groupId !== 'string') return;

        // If user is already a member, just go to the chat
        if (group?.members.includes(userProfile.farmerId)) {
             router.push(`/community/${groupId}`);
             return;
        }

        setIsJoining(true);
        try {
            const result = addUserToGroup(groupId, userProfile.farmerId);
            if (result.success) {
                toast({
                    title: t.community.join.welcome,
                    description: t.community.join.joinSuccess(group?.name || ''),
                });
                router.push(`/community/${groupId}`);
            } else {
                // This case handles errors like group not found, which should be rare here.
                toast({ variant: 'destructive', title: t.community.join.failed, description: result.error });
                setIsJoining(false);
            }
        } catch (err) {
            toast({ variant: 'destructive', title: t.community.join.error, description: t.community.join.unexpectedError });
            setIsJoining(false);
        }
    };
    
    let content;

    if (isLoading) {
        content = <div className="flex flex-col items-center gap-2"><Spinner className="h-8 w-8" /> <p>{t.community.join.loading}</p></div>;
    } else if (error) {
        content = (
             <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>{t.community.join.error}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-destructive">{error}</p>
                </CardContent>
                <CardFooter>
                     <Button variant="outline" asChild className="w-full">
                        <Link href="/community">
                            <ArrowLeft className="mr-2 h-4 w-4" /> {t.community.join.goBack}
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        );
    } else if (group) {
        const isAlreadyMember = group.members.includes(userProfile?.farmerId ?? '');
        content = (
            <Card className="w-full max-w-md animate-fade-in">
                <CardHeader className="items-center text-center">
                     <Avatar className="h-20 w-20 mb-2">
                        <AvatarImage src={group.avatarUrl ?? `https://picsum.photos/seed/${groupId}/80/80`} />
                        <AvatarFallback>{group.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="font-headline">{group.name}</CardTitle>
                    <CardDescription>{t.community.join.invite}</CardDescription>
                    <div className="flex items-center gap-4 pt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1"><Users className="h-4 w-4"/> {group.members.length} {t.community.group.members}</div>
                        <span>•</span>
                        <div>{group.city}</div>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-center text-muted-foreground bg-muted p-3 rounded-md">
                        {group.description || t.community.join.noDescription}
                    </p>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <Button onClick={handleJoinGroup} disabled={isJoining} className="w-full">
                        {isJoining ? <Spinner className="mr-2 h-4 w-4"/> : null}
                        {isAlreadyMember ? t.community.join.openChat : t.community.join.joinGroup}
                    </Button>
                     <Button variant="ghost" asChild className="w-full">
                        <Link href="/community">{t.community.group.cancel}</Link>
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    return (
        <div className="flex justify-center items-center h-full -mt-20">
            {content}
        </div>
    );
}
