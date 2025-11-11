
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, MessageCircle, Send, Search, Share, Award, PlusCircle, Users, Crown, X, Image as ImageIcon, Video, Repeat, Building, Briefcase, Phone, MessageSquare, ArrowRight } from "lucide-react";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { createGroup, getGroups, type Group, addUserToGroup } from "@/lib/firebase/groups";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { Timestamp } from "firebase/firestore";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { sendMessage } from "@/lib/firebase/chat";
import { EXPERT_BOT_USER } from "@/lib/firebase/chat";
import { indianCities } from "@/lib/indian-cities";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import type { UserProfile as AppUserProfile } from "@/lib/firebase/users";
import { useGroups } from "@/hooks/use-groups";
import { getStoredPosts, addPost, updatePost, type Post, type Comment } from "@/lib/firebase/posts";


const allCitiesList = Object.values(indianCities).flat();

const staticExpertData = [
  {
    id: EXPERT_BOT_USER.id,
    name: "Dr. Anjali Verma",
    avatar: "https://picsum.photos/seed/expert-1/80/80",
    specialization: "Agronomy & Soil Science",
    location: "Ludhiana",
    contact: "+91 98765 12345",
    type: "expert",
  },
  {
    id: 'ngo-1',
    name: "Digital Green",
    avatar: "https://picsum.photos/seed/ngo-1/80/80",
    specialization: "Community-led Agricultural Videos",
    location: "Patna",
    contact: "+91 91234 56789",
    type: "ngo",
  },
  {
    id: 'expert-2',
    name: "Dr. Rakesh Kumar",
    avatar: "https://picsum.photos/seed/expert-2/80/80",
    specialization: "Horticulture & Pest Management",
    location: "New Delhi",
    contact: "+91 99887 76655",
    type: "expert",
  },
  {
    id: 'ngo-2',
    name: "Agri-Tech Foundation",
    avatar: "https://picsum.photos/seed/ngo-2/80/80",
    specialization: "Promoting Sustainable Farming",
    location: "Pune",
    contact: "+91 98765 54321",
    type: "ngo",
  },
   {
    id: 'expert-3',
    name: "Dr. Meera Desai",
    avatar: "https://picsum.photos/seed/expert-3/80/80",
    specialization: "Organic Farming & Certification",
    location: "Bengaluru",
    contact: "+91 91122 33445",
    type: "expert",
  },
  {
    id: 'ngo-3',
    name: "Watershed Organisation Trust (WOTR)",
    avatar: "https://picsum.photos/seed/ngo-3/80/80",
    specialization: "Watershed Development & Climate Adaptation",
    location: "Pune",
    contact: "+91 95566 77889",
    type: "ngo",
  },
  {
    id: 'expert-4',
    name: "Dr. Vijay Singh",
    avatar: "https://picsum.photos/seed/expert-4/80/80",
    specialization: "Crops & Fertilizers",
    location: "Hisar",
    contact: "+91 94123 45678",
    type: "expert",
  },
  {
    id: 'ngo-4',
    name: "BAIF Development Research Foundation",
    avatar: "https://picsum.photos/seed/ngo-4/80/80",
    specialization: "Livestock Development & Water Management",
    location: "Pune",
    contact: "+91 98220 12345",
    type: "ngo",
  },
  {
    id: 'expert-5',
    name: "Dr. Aisha Khan",
    avatar: "https://picsum.photos/seed/expert-5/80/80",
    specialization: "Pests & Irrigation",
    location: "Hyderabad",
    contact: "+91 99887 76655",
    type: "expert",
  },
];


const initialGroupsData = [
  { id: 'group-1', name: 'Ludhiana Wheat Farmers', city: 'Ludhiana', description: 'A group for wheat farmers in Ludhiana to discuss best practices.', createdBy: 'Admin', members: ['user-1'] },
  { id: 'group-2', name: 'Jalandhar Potato Growers', city: 'Jalandhar', description: 'Connecting potato growers in the Jalandhar region.', createdBy: 'Admin', members: ['user-2'] },
  { id: 'group-3', name: 'Patiala Dairy Farmers', city: 'Patiala', description: 'Discussions on dairy farming, cattle health, and milk prices.', createdBy: 'Admin', members: ['user-3'] },
  { id: 'group-4', name: 'Organic Farming Pune', city: 'Pune', description: 'A community for organic farmers in and around Pune.', createdBy: 'Admin', members: ['user-4'] },
  { id: 'group-5', name: 'Bengaluru Horticulturists', city: 'Bengaluru', description: 'For farmers growing fruits, vegetables, and flowers in Bengaluru.', createdBy: 'Admin', members: ['user-5'] },
  { id: 'group-6', name: 'Hyderabad Cotton & Chilli', city: 'Hyderabad', description: 'Market trends and farming techniques for cotton and chilli.', createdBy: 'Admin', members: ['user-6'] },
  { id: 'group-7', name: 'Rajasthan Agri-Innovators', city: 'Jaipur', description: 'Sharing new techniques and technology for farming in Rajasthan.', createdBy: 'Admin', members: [] },
  { id: 'group-8', name: 'UP Sugarcane Collective', city: 'Lucknow', description: 'A group for sugarcane farmers in Uttar Pradesh to discuss cultivation and pricing.', createdBy: 'Admin', members: [] },
  { id: 'group-9', name: 'MP Soybean Producers', city: 'Indore', description: 'Market updates, pest control, and best practices for soybean cultivation in Madhya Pradesh.', createdBy: 'Admin', members: [] },
];

type UserProfile = AppUserProfile;


const ShareDialog = ({ post, groups, userProfile, onPostCreated, t }: { post: Post, groups: Group[], userProfile: UserProfile | null, onPostCreated: (post: Post) => void, t: any }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [isSharing, setIsSharing] = useState(false);
    const { toast } = useToast();

    const handleShareToGroup = async () => {
        if (!selectedGroup || !userProfile) {
            toast({ variant: 'destructive', title: t.community.share.selectionRequired, description: t.community.share.selectGroup });
            return;
        }
        setIsSharing(true);
        try {
            const postContent = `${t.community.share.sharedBy} ${post.author}:\n\n*${post.title}*\n${post.content}`;
            
            await sendMessage({
                groupId: selectedGroup,
                author: {
                    id: userProfile.farmerId,
                    name: userProfile.name,
                    avatar: userProfile.avatar,
                },
                text: postContent,
                file: null, // File sharing in chat not implemented in this flow
                onProgress: () => {},
            });

            toast({ title: t.community.share.postShared, description: t.community.share.postSharedDesc(post.title) });
            setIsOpen(false);

        } catch (error) {
            console.error("Error sharing post:", error);
            toast({ variant: 'destructive', title: t.community.share.error, description: t.community.share.errorDesc });
        } finally {
            setIsSharing(false);
        }
    };
    
    const handleSocialShare = (platform: 'whatsapp' | 'facebook') => {
        const text = `${t.community.share.socialShareText}\n\n*${post.title}*\n${post.content}`;
        const encodedText = encodeURIComponent(text);
        
        let url = '';
        if (platform === 'whatsapp') {
            url = `https://wa.me/?text=${encodedText}`;
        } else if (platform === 'facebook') {
            const appUrl = "https://play.google.com/store/apps/details?id=com.firebase.studio"; 
            url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}&quote=${encodedText}`;
        }
        
        window.open(url, '_blank', 'noopener,noreferrer');
        setIsOpen(false);
    }
    
    const handleShareToFeed = () => {
        if (!userProfile) return;

        const repost: Post = {
            ...post, // Copy original post properties
            id: Date.now(), // New ID
            author: userProfile.name, // Repost is by the current user
            avatar: userProfile.avatar,
            location: userProfile.city,
            time: t.community.post.justNow,
            likes: 0,
            comments: [],
            originalAuthor: post.author, // Add reference to original author
            title: post.title, // Keep original title for repost context
            content: post.content // Keep original content
        };

        onPostCreated(repost);
        toast({ title: t.community.share.postShared, description: t.community.share.sharedToFeed });
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                    <Share className="h-4 w-4" /> {t.community.post.share}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t.community.share.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                     <Card className="bg-muted/50">
                        <CardHeader className="p-4">
                            <p className="font-semibold">{post.title}</p>
                            <p className="text-xs text-muted-foreground">{t.community.share.by} {post.author}</p>
                        </CardHeader>
                    </Card>

                    <Button onClick={handleShareToFeed} className="w-full">
                        <Repeat className="mr-2 h-4 w-4" /> {t.community.share.shareToFeed}
                    </Button>

                    <div className="relative">
                        <Separator />
                        <span className="absolute left-1/2 -top-3 -translate-x-1/2 bg-popover px-2 text-xs text-muted-foreground">{t.community.share.or}</span>
                    </div>

                     <div>
                        <Label>{t.community.share.shareToGroup}</Label>
                        <div className="flex gap-2 mt-2">
                             <Select onValueChange={setSelectedGroup} value={selectedGroup}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t.community.share.selectGroupPlaceholder} />
                                </SelectTrigger>
                                <SelectContent>
                                    {groups.length > 0 ? groups.map(group => (
                                        <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                                    )) : <p className="p-4 text-sm text-muted-foreground">{t.community.share.noGroups}</p>}
                                </SelectContent>
                            </Select>
                             <Button onClick={handleShareToGroup} disabled={isSharing || !selectedGroup}>
                                {isSharing ? <Spinner className="mr-2 h-4 w-4" /> : <Send className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                    
                    <div className="relative">
                        <Separator />
                        <span className="absolute left-1/2 -top-3 -translate-x-1/2 bg-popover px-2 text-xs text-muted-foreground">{t.community.share.or}</span>
                    </div>

                    <div>
                        <Label>{t.community.share.shareOnSocial}</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                             <Button variant="outline" className="bg-[#25D366] hover:bg-[#25D366]/90 text-white" onClick={() => handleSocialShare('whatsapp')}>
                                WhatsApp
                            </Button>
                            <Button variant="outline" className="bg-[#1877F2] hover:bg-[#1877F2]/90 text-white" onClick={() => handleSocialShare('facebook')}>
                                Facebook
                            </Button>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsOpen(false)}>{t.community.group.cancel}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


const PostCard = ({ post, onLike, onComment, userProfile, groups, onPostCreated, t, isGrid = false }: { post: Post, onLike: (id: number) => void; onComment: (id: number, comment: Comment) => void; userProfile: UserProfile | null; groups: Group[]; onPostCreated: (post: Post) => void; t: any; isGrid?: boolean; }) => {
    const [commentText, setCommentText] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);
    
    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim() || !userProfile) return;
        onComment(post.id, {
            author: userProfile.name,
            content: commentText,
            avatar: userProfile.avatar,
        });
        setCommentText("");
    };
    
    const renderMedia = (p: Post) => {
      if (!p.image) return null;
      
      const mediaType = p.mediaType || 'image';

      return (
         <div className={cn("mt-2 rounded-lg overflow-hidden border max-h-[300px]")}>
           {mediaType.startsWith('image') ? (
              <Image
                src={p.image}
                alt={p.title || t.community.post.postImageAlt}
                width={600}
                height={300}
                className="w-full h-full object-cover"
                data-ai-hint={p.imageHint}
              />
           ) : (
             <video src={p.image} className="w-full h-full object-cover" controls />
           )}
         </div>
      );
    }

    if (isGrid) {
        return (
            <Card className="overflow-hidden relative group cursor-pointer">
                 {renderMedia(post) ? renderMedia(post) : (
                    <div className="p-4 aspect-square">
                        <h4 className="font-semibold mb-1 line-clamp-2">{post.title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-4">{post.content}</p>
                    </div>
                 )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                     <div className="flex items-center gap-4 text-sm font-semibold">
                        <span className="flex items-center gap-1.5"><ThumbsUp className="h-4 w-4" /> {post.likes}</span>
                        <span className="flex items-center gap-1.5"><MessageCircle className="h-4 w-4" /> {post.comments.length}</span>
                    </div>
                </div>
            </Card>
        )
    }

    return (
    <Collapsible asChild>
        <Card className="animate-fade-in-up">
        <CardHeader className="flex flex-row items-start gap-3 space-y-0 p-4">
            <Avatar className="h-9 w-9">
            <AvatarImage src={post.avatar} data-ai-hint={post.avatarHint} />
            <AvatarFallback>{post.author.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
            <div className="flex items-start justify-between">
                <div>
                <p className="font-semibold text-sm">{post.author}</p>
                <p className="text-xs text-muted-foreground">
                    {post.time} • {post.location}
                </p>
                </div>
                {post.originalAuthor ? (
                    <Badge variant="secondary" className="text-xs">
                        <Repeat className="h-3 w-3 mr-1.5"/>
                        {t.community.post.shared}
                    </Badge>
                ) : (
                    <Badge className={`${post.categoryColor} text-white text-xs`}>{post.category}</Badge>
                )}
            </div>
            </div>
        </CardHeader>
        <CardContent className="px-4 pb-2 pt-0">
            {post.originalAuthor ? (
                <>
                    <p className="text-sm text-muted-foreground mb-2">{t.community.post.sharedFrom} <span className="font-semibold text-foreground">{post.originalAuthor}</span></p>
                    <Card className="p-3 bg-muted/50">
                        <h4 className="font-semibold mb-1 text-sm">{post.title}</h4>
                        <p className="text-xs text-muted-foreground">{post.content}</p>
                        {renderMedia(post)}
                    </Card>
                </>
            ) : (
                <>
                    <h4 className="font-semibold mb-1">{post.title}</h4>
                    <p className={cn("text-sm text-muted-foreground", !isExpanded && "line-clamp-2")}>{post.content}</p>
                    {post.content.length > 100 && (
                        <button onClick={() => setIsExpanded(!isExpanded)} className="text-xs text-primary font-semibold mt-1">
                            {isExpanded ? t.community.post.readLess : t.community.post.readMore}
                        </button>
                    )}
                    {renderMedia(post)}
                </>
            )}
        </CardContent>
        <CardFooter className="flex items-center justify-between p-2">
            <div className="flex">
                <Button variant="ghost" size="sm" onClick={() => onLike(post.id)} className="flex items-center gap-1.5 text-muted-foreground hover:text-primary">
                    <ThumbsUp className="h-4 w-4" /> <span className="text-xs">{post.likes}</span>
                </Button>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-1.5 text-muted-foreground hover:text-primary">
                        <MessageCircle className="h-4 w-4" /> <span className="text-xs">{post.comments.length}</span>
                    </Button>
                </CollapsibleTrigger>
                <ShareDialog post={post} groups={groups} userProfile={userProfile} onPostCreated={onPostCreated} t={t} />
            </div>
        </CardFooter>
            <CollapsibleContent>
                <div className="px-4 pb-4 space-y-3 border-t pt-3">
                    {post.comments.length > 0 && (
                    <div className="space-y-3">
                        {post.comments.map((comment, index) => (
                            <div key={index} className="flex items-start gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={comment.isAi ? '' : comment.avatar} data-ai-hint="farm icon" />
                                    <AvatarFallback>{comment.author.substring(0,2)}</AvatarFallback>
                                </Avatar>
                                <div className={`flex-1 p-2 rounded-md text-sm ${comment.isAi ? 'bg-primary/10' : 'bg-muted/70'}`}>
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold">{comment.author}</p>
                                        {comment.isExpert && <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 border-amber-200"><Award className="h-3 w-3 mr-1"/>{t.community.post.expert}</Badge>}
                                    </div>
                                    <p className="text-foreground/80 text-xs">{comment.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    )}
                    {userProfile && (
                            <form onSubmit={handleCommentSubmit} className="flex items-center gap-2 pt-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={userProfile.avatar} />
                                    <AvatarFallback>{userProfile.name.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                <Input 
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder={t.community.post.writeComment}
                                    className="h-9 text-xs"
                                />
                                <Button type="submit" size="icon" className="h-9 w-9" disabled={!commentText.trim()}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        )}
                </div>
        </CollapsibleContent>
        </Card>
    </Collapsible>
    );
};

const CreateGroupDialog = ({ onGroupCreated, t }: { onGroupCreated: () => void, t: any }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [city, setCity] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        const profile = localStorage.getItem('userProfile');
        if (profile) {
            const parsed = JSON.parse(profile);
            setUserProfile(parsed);
            if (parsed.city) {
                setCity(parsed.city);
            }
        }
    }, []);

    const handleSubmit = () => {
        if (!name.trim() || !city || !userProfile?.farmerId) {
            toast({
                variant: "destructive",
                title: t.community.createGroup.incompleteTitle,
                description: t.community.createGroup.incompleteDesc,
            });
            return;
        }
        setIsCreating(true);

        try {
            const newGroupData = {
                name,
                description,
                city: city,
                ownerId: userProfile.farmerId,
                members: [userProfile.farmerId],
                createdBy: userProfile.name,
                avatarUrl: `https://picsum.photos/seed/${name.replace(/\s/g, '-')}/100/100`
            };
            const newGroup = createGroup(newGroupData);
            onGroupCreated();
            toast({
                title: t.community.createGroup.success,
                description: t.community.createGroup.successDesc(newGroup.name),
            });
            setIsOpen(false);
            setName('');
            setDescription('');
            setCity(userProfile?.city || '');
            router.push(`/community/${newGroup.id}`);
        } catch (error) {
            console.error("Error creating group:", error);
            toast({
                variant: 'destructive',
                title: t.community.createGroup.error,
                description: t.community.createGroup.errorDesc,
            });
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {t.community.createGroup.button}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t.community.createGroup.title}</DialogTitle>
                    <DialogDescription>
                        {t.community.createGroup.description}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            {t.community.createGroup.nameLabel}
                        </Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" placeholder={t.community.createGroup.namePlaceholder} />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="city" className="text-right">
                            {t.community.createGroup.cityLabel}
                        </Label>
                        <div className="col-span-3">
                            <Select onValueChange={setCity} value={city}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t.community.createGroup.cityPlaceholder} />
                                </SelectTrigger>
                                <SelectContent>
                                    {allCitiesList.sort().map(c => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">
                            {t.community.createGroup.descLabel}
                        </Label>
                        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" placeholder={t.community.createGroup.descPlaceholder} />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleSubmit} disabled={isCreating || !name.trim() || !city}>
                        {isCreating && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
                        {t.community.createGroup.button}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const NewPostDialog = ({ userProfile, onPostCreated, t }: { userProfile: UserProfile | null, onPostCreated: (post: Post) => void, t: any }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isPosting, setIsPosting] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setMediaFile(file);
            setMediaPreview(URL.createObjectURL(file));
        }
    };

    const resetForm = () => {
        setTitle('');
        setContent('');
        setMediaFile(null);
        setMediaPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handlePostSubmit = () => {
        if (!title.trim() || !content.trim() || !userProfile) {
            toast({ variant: 'destructive', title: t.community.newPost.incomplete, description: t.community.newPost.incompleteDesc });
            return;
        }

        setIsPosting(true);
        // Simulate posting delay and file processing
        setTimeout(() => {
            const newPost: Post = {
                id: Date.now(),
                author: userProfile.name,
                avatar: userProfile.avatar,
                location: userProfile.city,
                category: "General", // Default category
                categoryColor: "bg-gray-500",
                time: t.community.post.justNow,
                title,
                content,
                image: mediaPreview, // The URL.createObjectURL result
                mediaType: mediaFile?.type ?? null,
                imageHint: 'user post',
                likes: 0,
                comments: [],
            };

            onPostCreated(newPost);
            toast({ title: t.community.newPost.success, description: t.community.newPost.successDesc });
            
            setIsPosting(false);
            setIsOpen(false);
            resetForm();

        }, 1500);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
                 <Button className="bg-primary hover:bg-primary/90">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {t.community.newPost.button}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t.community.newPost.title}</DialogTitle>
                    <DialogDescription>{t.community.newPost.description}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <Input placeholder={t.community.newPost.titlePlaceholder} value={title} onChange={(e) => setTitle(e.target.value)} disabled={isPosting}/>
                    <Textarea placeholder={t.community.newPost.contentPlaceholder} value={content} onChange={(e) => setContent(e.target.value)} rows={5} disabled={isPosting} />

                    {mediaPreview && (
                        <div className="relative border rounded-lg overflow-hidden">
                             {mediaFile?.type.startsWith('image/') ? (
                                <Image src={mediaPreview} alt={t.community.newPost.mediaPreviewAlt} width={500} height={300} className="w-full h-auto object-cover"/>
                             ) : (
                                <video src={mediaPreview} controls className="w-full h-auto"/>
                             )}
                            <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 rounded-full" onClick={() => { setMediaFile(null); setMediaPreview(null); }}>
                                <X className="h-4 w-4"/>
                            </Button>
                        </div>
                    )}
                </div>
                <DialogFooter className="justify-between sm:justify-between">
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isPosting}>
                        <ImageIcon className="mr-2 h-4 w-4"/>
                        {t.community.newPost.photoVideo}
                    </Button>
                     <Input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*"/>
                    <Button onClick={handlePostSubmit} disabled={isPosting || !title.trim() || !content.trim()}>
                        {isPosting && <Spinner className="mr-2 h-4 w-4"/>}
                        {isPosting ? t.community.newPost.posting : t.community.newPost.post}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const PostDetailDialog = ({ post, userProfile, groups, onLike, onComment, onPostCreated, open, onOpenChange, t }: { post: Post | null, userProfile: UserProfile | null, groups: Group[], onLike: (id: number) => void; onComment: (id: number, comment: Comment) => void; onPostCreated: (post: Post) => void; open: boolean; onOpenChange: (open: boolean) => void, t: any }) => {
    if (!post) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md p-0 sm:max-w-sm">
                 <DialogHeader>
                    <DialogTitle className="sr-only">{t.community.post.postFrom(post.author)}</DialogTitle>
                    <DialogDescription className="sr-only">{post.title}</DialogDescription>
                </DialogHeader>
                 <PostCard
                    post={post}
                    onLike={onLike}
                    onComment={onComment}
                    userProfile={userProfile}
                    groups={groups}
                    onPostCreated={onPostCreated}
                    t={t}
                    isGrid={false}
                />
            </DialogContent>
        </Dialog>
    )
}


export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterCity, setFilterCity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { t, isLoaded } = useTranslation();
  const { groups, isLoading: isLoadingGroups, fetchGroups } = useGroups(userProfile);


  useEffect(() => {
    if (!isLoaded) return;

    const fetchPostsAndProfile = async () => {
        setIsLoadingPosts(true);
        const storedPosts = getStoredPosts();
        setPosts(storedPosts);
        setIsLoadingPosts(false);

        const profile = localStorage.getItem('userProfile');
        if (profile) {
            setUserProfile(JSON.parse(profile));
        }
    };
    
    fetchPostsAndProfile();

    const handleStorageChange = () => {
        const storedPosts = getStoredPosts();
        setPosts(storedPosts);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
  }, [isLoaded]);

  
  const expertData = useMemo(() => {
    let allExperts = [...staticExpertData];
    if (userProfile && (userProfile.userType === 'expert' || userProfile.userType === 'ngo')) {
        // Check if user is already in the list
        const userAsExpert = allExperts.find(e => e.id === userProfile.farmerId);
        if (!userAsExpert) {
            allExperts.unshift({
                id: userProfile.farmerId,
                name: userProfile.name,
                avatar: userProfile.avatar,
                specialization: userProfile.specialization || "User Provided Expert/NGO",
                location: userProfile.city,
                contact: userProfile.phone,
                type: userProfile.userType,
            });
        }
    }
    return allExperts;
  }, [userProfile]);

  const handleGroupCreated = () => {
      fetchGroups();
  }

  const handleNewPost = async (newPost: Post) => {
    await addPost(newPost);
    const updatedPosts = getStoredPosts();
    setPosts(updatedPosts);
  };
  
  const handleLike = async (postId: number) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
        await updatePost(postId, { likes: post.likes + 1 });
        const updatedPosts = getStoredPosts();
        setPosts(updatedPosts);
        if (selectedPost && selectedPost.id === postId) {
            setSelectedPost(prev => prev ? { ...prev, likes: prev.likes + 1 } : null);
        }
    }
  };

  const handleComment = async (postId: number, newComment: Comment) => {
     const post = posts.find(p => p.id === postId);
     if (post) {
        const updatedComments = [...post.comments, newComment];
        await updatePost(postId, { comments: updatedComments });
        const updatedPosts = getStoredPosts();
        setPosts(updatedPosts);
        if (selectedPost && selectedPost.id === postId) {
            setSelectedPost(prev => prev ? { ...prev, comments: updatedComments } : null);
        }
     }
  };

  const handleJoinGroup = (groupId: string, groupName: string) => {
      if (!userProfile) {
          toast({ variant: 'destructive', title: "Login Required", description: "You must be logged in to join a group." });
          router.push('/login');
          return;
      }
      
      const result = addUserToGroup(groupId, userProfile.farmerId);
      if (result.success) {
          toast({ title: "Joined Successfully!", description: `You have joined the "${groupName}" group.` });
          router.push(`/community/${groupId}`);
      } else {
          toast({ variant: 'destructive', title: "Failed to Join", description: result.error });
      }
    };

  const isProfileComplete = !!(userProfile?.state && userProfile.city);

  const { userGroups } = useGroups(userProfile);

  const myPosts = posts.filter(p => userProfile && p.author === userProfile.name);

  const filteredPosts = posts.filter(post => {
      const categoryMatch = filterCategory === 'all' || post.category === filterCategory;
      const cityMatch = filterCity === 'all' || post.location === filterCity;
      const searchMatch = !searchQuery || 
                          post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          post.content.toLowerCase().includes(searchQuery.toLowerCase());
      return categoryMatch && cityMatch && searchMatch;
  });

  const filteredGroups = groups.filter(group => {
      const cityMatch = filterCity === 'all' || group.city === filterCity;
      const searchMatch = !searchQuery || 
                          group.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (group.description && group.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return cityMatch && searchMatch;
  });

  const filteredExperts = expertData.filter(expert => {
      const categoryMatch = filterCategory === 'all' || expert.specialization.toLowerCase().includes(filterCategory.toLowerCase());
      const cityMatch = filterCity === 'all' || expert.location === filterCity;
      const searchMatch = !searchQuery || 
                          expert.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          expert.specialization.toLowerCase().includes(searchQuery.toLowerCase());
      return categoryMatch && cityMatch && searchMatch;
  });

  // Effect to handle automatic tab switching based on search results
  useEffect(() => {
    if (!searchQuery) return;

    const resultsCount = {
        home: filteredPosts.length,
        local: filteredGroups.length,
        experts: filteredExperts.length
    };
    
    // Don't switch if the current tab already has results
    if (resultsCount[activeTab as keyof typeof resultsCount] > 0) {
        return;
    }

    // Find the tab with the most results
    let maxResults = 0;
    let bestTab = activeTab;

    for (const [tab, count] of Object.entries(resultsCount)) {
        if (count > maxResults) {
            maxResults = count;
            bestTab = tab;
        }
    }

    if (bestTab !== activeTab) {
        setActiveTab(bestTab);
    }
  }, [searchQuery, filteredPosts.length, filteredGroups.length, filteredExperts.length, activeTab]);


  const allCategories = ['all', ...Array.from(new Set(posts.map(p => p.category)))];
  const allCities = ['all', ...Array.from(new Set([...posts.map(p => p.location), ...expertData.map(e => e.location), ...initialGroupsData.map(g => g.city)]))];

  const handleChat = (expert: (typeof expertData)[0]) => {
      if (!userProfile) {
          toast({ variant: 'destructive', title: t.community.experts.loginRequired, description: t.community.experts.loginRequiredDesc });
          return;
      }

      toast({ title: t.community.experts.creatingChat, description: t.community.experts.creatingChatDesc(expert.name) });

      // Create a "group" that represents a direct message channel
      const dmGroupId = `dm-${userProfile.farmerId}-${expert.id}`;
      const existingDm = getGroups().find(g => g.id === dmGroupId);

      if (existingDm) {
          router.push(`/community/${dmGroupId}`);
          return;
      }

      const newDmGroup = createGroup({
          id: dmGroupId, // Use a predictable ID for DMs
          name: t.community.experts.chatWith(expert.name),
          description: t.community.experts.dmChannel(userProfile.name, expert.name),
          city: userProfile.city,
          ownerId: userProfile.farmerId,
          members: [userProfile.farmerId, expert.id],
          createdBy: userProfile.name,
          avatarUrl: expert.avatar,
      });

      handleGroupCreated();
      router.push(`/community/${newDmGroup.id}`);
  };


  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold font-headline">{t.community.title}</h1>
                <p className="text-muted-foreground">
                {t.community.description}
                </p>
            </div>
            <NewPostDialog userProfile={userProfile} onPostCreated={handleNewPost} t={t} />
        </div>
        
      <Card>
          <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select onValueChange={setFilterCategory} value={filterCategory}>
                      <SelectTrigger>
                          <SelectValue placeholder={t.community.filterTopic} />
                      </SelectTrigger>
                      <SelectContent>
                          {allCategories.map(cat => <SelectItem key={cat} value={cat}>{cat === 'all' ? t.community.allTopics : cat}</SelectItem>)}
                      </SelectContent>
                  </Select>
                  <Select onValueChange={setFilterCity} value={filterCity}>
                      <SelectTrigger>
                          <SelectValue placeholder={t.community.filterLocation} />
                      </SelectTrigger>
                      <SelectContent>
                          {allCities.map(city => <SelectItem key={city} value={city}>{city === 'all' ? t.community.allLocations : city}</SelectItem>)}
                      </SelectContent>
                  </Select>
              </div>
          </CardContent>
      </Card>


      <PostDetailDialog 
        post={selectedPost}
        open={!!selectedPost}
        onOpenChange={(open) => { if(!open) setSelectedPost(null); }}
        userProfile={userProfile}
        groups={userGroups}
        onLike={handleLike}
        onComment={handleComment}
        onPostCreated={handleNewPost}
        t={t}
      />


       <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="overflow-x-auto pb-1">
                <TabsList className="grid w-full grid-cols-4 min-w-[500px]">
                    <TabsTrigger value="home">{t.community.tabs.home}</TabsTrigger>
                    <TabsTrigger value="myposts">{t.community.tabs.myPosts} ({myPosts.length})</TabsTrigger>
                    <TabsTrigger value="local">{t.community.tabs.groups}</TabsTrigger>
                    <TabsTrigger value="experts">{t.community.tabs.experts}</TabsTrigger>
                </TabsList>
            </div>
            <TabsContent value="home" className="pt-4">
                {isLoadingPosts ? (
                    <div className="text-center py-16"><Spinner /></div>
                ) : filteredPosts.length > 0 ? (
                    <div className="space-y-4 max-w-xl mx-auto">
                        {filteredPosts.map((post) => (
                           <PostCard 
                                key={post.id} 
                                post={post} 
                                onLike={handleLike} 
                                onComment={handleComment} 
                                userProfile={userProfile} 
                                groups={userGroups} 
                                onPostCreated={handleNewPost} 
                                t={t} 
                                isGrid={false}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground pt-8">{t.community.noPostsFound}</p>
                )}
            </TabsContent>
            <TabsContent value="myposts" className="space-y-4 pt-4">
                 {isLoadingPosts ? (
                    <div className="text-center py-16"><Spinner /></div>
                ) : myPosts.length > 0 ? (
                    <div className="space-y-4 max-w-xl mx-auto">
                        {myPosts.map((post) => (
                            <PostCard key={post.id} post={post} onLike={handleLike} onComment={handleComment} userProfile={userProfile} groups={userGroups} onPostCreated={handleNewPost} t={t} />
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground pt-8">{t.community.noPostsYet}</p>
                )}
            </TabsContent>
             <TabsContent value="local" className="pt-4 space-y-4">
                <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
                    <div className="w-full sm:max-w-xs relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search groups..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    {isProfileComplete ? (
                        <CreateGroupDialog onGroupCreated={handleGroupCreated} t={t} />
                    ) : (
                         <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" asChild>
                                        <Link href="/profile">
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            {t.community.createGroup.button}
                                        </Link>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t.community.createGroup.completeProfile}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
                {isLoadingGroups ? (
                    <div className="flex justify-center items-center py-16"><Spinner className="h-8 w-8" /><p className="ml-2">{t.community.loadingGroups}</p></div>
                ) : filteredGroups.length === 0 ? (
                    <p className="text-center text-muted-foreground pt-8">{t.community.noGroupsFound}</p>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredGroups.map(group => (
                        <Card key={group.id} className="flex flex-col bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className='flex-1'>
                                        <CardTitle className="text-lg font-headline">{group.name}</CardTitle>
                                        <div className="text-sm text-muted-foreground mt-1">
                                          <span>{group.city}</span>
                                        </div>
                                    </div>
                                    <Avatar className="h-12 w-12 border-2 border-background">
                                        <AvatarImage src={group.avatarUrl} />
                                        <AvatarFallback>{group.name.substring(0, 2)}</AvatarFallback>
                                    </Avatar>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-sm text-muted-foreground line-clamp-2">{group.description || t.community.noGroupDescription}</p>
                            </CardContent>
                            <CardFooter className="flex-col items-stretch gap-2">
                                 <div className="flex items-center text-xs text-muted-foreground">
                                    <Users className="h-4 w-4 mr-1.5"/>
                                    <span>{group.members.length} members</span>
                                    <span className="mx-2">•</span>
                                    <Crown className="h-4 w-4 mr-1 text-amber-500"/>
                                    <span>{group.createdBy}</span>
                                </div>
                                <Button onClick={() => handleJoinGroup(group.id, group.name)} className="w-full">
                                    {userProfile && group.members.includes(userProfile.farmerId) ? t.community.openChat : 'Join Group'}
                                    <ArrowRight className="ml-2 h-4 w-4"/>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                    </div>
                )}
             </TabsContent>
            <TabsContent value="experts" className="pt-4 space-y-4">
                 <div className="grid gap-4 md:grid-cols-2">
                    {filteredExperts.length > 0 ? filteredExperts.map(expert => (
                         <Card key={expert.id}>
                            <CardHeader className="flex flex-row items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={expert.avatar} />
                                    <AvatarFallback>{expert.name.substring(0,2)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        {expert.name}
                                        <Badge variant="outline" className={expert.type === 'expert' ? 'border-blue-500 text-blue-600' : 'border-green-500 text-green-600'}>
                                            {expert.type === 'expert' ? <Briefcase className="h-3 w-3 mr-1" /> : <Building className="h-3 w-3 mr-1" />}
                                            {expert.type === 'expert' ? t.community.experts.expert : t.community.experts.ngo}
                                        </Badge>
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground">{expert.specialization}</p>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <p className="text-muted-foreground"><span className="font-semibold text-foreground">{t.community.experts.location}:</span> {expert.location}</p>
                                <p className="text-muted-foreground"><span className="font-semibold text-foreground">{t.community.experts.contact}:</span> {expert.contact}</p>
                            </CardContent>
                            <CardFooter className="grid grid-cols-2 gap-2">
                                <Button variant="outline" asChild>
                                    <a href={`tel:${expert.contact.replace(/\s/g, '')}`}>
                                      <Phone className="mr-2 h-4 w-4" /> {t.community.experts.call}
                                    </a>
                                </Button>
                                <Button onClick={() => handleChat(expert)}>
                                    <MessageSquare className="mr-2 h-4 w-4"/> {t.community.experts.chat}
                                </Button>
                            </CardFooter>
                        </Card>
                    )) : (
                        <p className="text-center text-muted-foreground pt-8 md:col-span-2">{t.community.experts.noExpertsFound}</p>
                    )}
                 </div>
            </TabsContent>
        </Tabs>

    </div>
  );
}
