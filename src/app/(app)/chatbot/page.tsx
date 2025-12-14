
"use client";

import { useState, useRef, useEffect } from "react";
import { answerFarmerQuestion } from "@/ai/flows/answer-farmer-question";
import { Bot, Image as ImageIcon, Mic, Send, User, X, Volume2, Loader2, Camera, RefreshCw, Share } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Image from "next/image";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/use-translation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useGroups } from "@/hooks/use-groups";
import type { Group } from "@/lib/firebase/groups";
import { sendMessage } from "@/lib/firebase/chat";
import type { Post } from "@/app/(app)/community/page";


type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: string;
  timestamp: Date;
};

type UserProfile = {
  name: string;
  phone: string;
  avatar: string;
  city?: string;
  language?: 'English' | 'Hindi';
  farmerId: string;
}


const CameraCaptureDialog = ({ open, onOpenChange, onCapture, t }: { open: boolean, onOpenChange: (open: boolean) => void, onCapture: (dataUri: string) => void, t: any }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        let stream: MediaStream | null = null;
        const getCameraPermission = async () => {
            if (!open || hasCameraPermission) return;
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setHasCameraPermission(true);
                }
            } catch (error) {
                console.error('Error accessing camera:', error);
                setHasCameraPermission(false);
                toast({
                    variant: 'destructive',
                    title: t.detection.cameraDenied,
                    description: t.detection.cameraDeniedDesc,
                });
            }
        };

        getCameraPermission();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [open, hasCameraPermission, toast, t]);

    const handleCaptureClick = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUri = canvas.toDataURL('image/jpeg');
            setCapturedImage(dataUri);
        }
    };

    const handleConfirm = () => {
        if (capturedImage) {
            onCapture(capturedImage);
            onOpenChange(false);
            setCapturedImage(null);
        }
    };
    
    const handleRetake = () => setCapturedImage(null);
    
    const handleDialogClose = (isOpen: boolean) => {
        if (!isOpen) {
             setCapturedImage(null);
             setHasCameraPermission(null);
        }
        onOpenChange(isOpen);
    }

    return (
        <Dialog open={open} onOpenChange={handleDialogClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t.detection.captureButton}</DialogTitle>
                </DialogHeader>
                <div className="w-full aspect-video rounded-lg bg-muted overflow-hidden relative border">
                     {capturedImage ? (
                        <Image src={capturedImage} alt="Captured" layout="fill" objectFit="cover" />
                    ) : (
                        <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                    )}
                     { hasCameraPermission === false && !capturedImage && (
                        <div className="absolute inset-0 flex items-center justify-center p-4">
                            <Alert variant="destructive">
                                <AlertTitle>{t.detection.cameraRequired}</AlertTitle>
                                <AlertDescription>{t.detection.cameraRequiredDesc}</AlertDescription>
                            </Alert>
                        </div>
                    )}
                </div>
                <canvas ref={canvasRef} className="hidden" />
                <DialogFooter>
                    {capturedImage ? (
                        <>
                            <Button variant="outline" onClick={handleRetake}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                {t.detection.retakeButton}
                            </Button>
                            <Button onClick={handleConfirm}>{t.chatbot.send}</Button>
                        </>
                    ) : (
                        <>
                            <DialogClose asChild>
                                <Button variant="ghost">{t.soilTesting.cancel}</Button>
                            </DialogClose>
                            <Button onClick={handleCaptureClick} disabled={!hasCameraPermission}>
                                <Camera className="mr-2 h-4 w-4" />
                                {t.detection.captureButton}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const ShareChatDialog = ({ message, userProfile, t }: { message: Message, userProfile: UserProfile | null, t: any }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [isSharing, setIsSharing] = useState(false);
    const { toast } = useToast();
    const { userGroups } = useGroups(userProfile);

    const handleShareToGroup = async () => {
        if (!selectedGroup || !userProfile) {
            toast({ variant: 'destructive', title: t.community.share.selectionRequired, description: t.community.share.selectGroup });
            return;
        }
        setIsSharing(true);
        try {
            const shareContent = `**${t.chatbot.sharedFrom}:**\n\n${message.content}`;
            
            await sendMessage({
                groupId: selectedGroup,
                author: {
                    id: userProfile.farmerId,
                    name: userProfile.name,
                    avatar: userProfile.avatar,
                },
                text: shareContent,
                file: null,
                onProgress: () => {},
            });

            toast({ title: t.community.share.postShared, description: t.chatbot.sharedToGroupSuccess });
            setIsOpen(false);
        } catch (error) {
            console.error("Error sharing post:", error);
            toast({ variant: 'destructive', title: t.community.share.error, description: t.community.share.errorDesc });
        } finally {
            setIsSharing(false);
        }
    };
    
    const handleShareToFeed = () => {
        if (!userProfile) return;

        const newPost: Post = {
            id: Date.now(),
            author: userProfile.name,
            avatar: userProfile.avatar,
            location: userProfile.city || "Unknown",
            category: "AI Tip",
            categoryColor: "bg-blue-500",
            time: t.community.post.justNow,
            title: t.chatbot.sharedFrom,
            content: message.content,
            image: null,
            mediaType: null,
            imageHint: 'ai generated',
            likes: 0,
            comments: [],
        };
        
        // This is a bit of a hack. We'll store the new post in localStorage
        // and the community page will pick it up. A proper state management solution would be better.
        const existingPosts = JSON.parse(localStorage.getItem('community_posts') || '[]');
        localStorage.setItem('community_posts', JSON.stringify([newPost, ...existingPosts]));
        window.dispatchEvent(new Event('storage')); // Notify other tabs/components

        toast({ title: t.community.share.postShared, description: t.community.share.sharedToFeed });
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -top-2 -left-2 h-7 w-7 text-primary-foreground opacity-70 group-hover:opacity-100 transition-opacity"
                >
                    <Share className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t.community.share.title}</DialogTitle>
                    <DialogDescription>{t.chatbot.shareDescription}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                     <Card className="bg-muted/50 p-4">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">{message.content}</p>
                    </Card>

                    <Button onClick={handleShareToFeed} className="w-full">
                        {t.community.share.shareToFeed}
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
                                    {userGroups.length > 0 ? userGroups.map(group => (
                                        <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                                    )) : <p className="p-4 text-sm text-muted-foreground">{t.community.share.noGroups}</p>}
                                </SelectContent>
                            </Select>
                             <Button onClick={handleShareToGroup} disabled={isSharing || !selectedGroup}>
                                {isSharing ? <Spinner className="mr-2 h-4 w-4" /> : <Send className="h-4 w-4" />}
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


export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [nowPlayingMessageId, setNowPlayingMessageId] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const { toast } = useToast();
  const { t, language, isLoaded } = useTranslation();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null); // For SpeechRecognition instance
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);


  useEffect(() => {
    if (!isLoaded) return;
    const savedProfile = localStorage.getItem("userProfile");
    const profile = savedProfile ? JSON.parse(savedProfile) : null;
    setUserProfile(profile);

    const populateVoiceList = () => {
      if (typeof window === 'undefined' || !window.speechSynthesis) return;
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
        // Important: remove listener after getting voices
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
    
    // Voices might load asynchronously. The 'onvoiceschanged' event is crucial.
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        // First try to get them immediately
        populateVoiceList();
        // If they are not ready, set an event listener
        if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = populateVoiceList;
        }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };

  }, [isLoaded]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);
  
  const speak = (message: Message) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
        toast({ variant: 'destructive', title: "Speech Error", description: "Text-to-speech is not supported on your browser." });
        return;
    }

    if (nowPlayingMessageId === message.id) {
      window.speechSynthesis.cancel();
      setNowPlayingMessageId(null);
      return;
    }
    
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(message.content);
    
    const isHindi = /[\u0900-\u097F]/.test(message.content);
    const targetLang = isHindi ? 'hi-IN' : 'en-US';
    utterance.lang = targetLang;

    // Smart voice selection: Prefer Google voices, fall back to any available voice for the language.
    let selectedVoice = null;
    if (targetLang === 'hi-IN') {
        selectedVoice = voices.find(voice => voice.lang === 'hi-IN' && voice.name.includes('Google')) 
                     || voices.find(voice => voice.lang === 'hi-IN');
    } else { // 'en-US' or other english variants
        selectedVoice = voices.find(voice => voice.lang.startsWith('en-') && voice.name.includes('Google')) 
                     || voices.find(voice => voice.lang.startsWith('en-'));
    }
    
    if (selectedVoice) {
        utterance.voice = selectedVoice;
    } else if (voices.length > 0) {
        console.warn(`No specific voice found for ${targetLang}. Using first available voice.`);
        utterance.voice = voices[0];
    } else {
        console.error("No voices available for text-to-speech.");
        toast({ variant: 'destructive', title: t.chatbot.speechError, description: "No voices available." });
        return;
    }
    
    utterance.onstart = () => setNowPlayingMessageId(message.id);
    utterance.onend = () => setNowPlayingMessageId(null);
    utterance.onerror = (e) => {
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
            console.error("Speech synthesis error", e);
            toast({ variant: 'destructive', title: t.chatbot.speechError, description: t.chatbot.speechErrorDesc });
        }
        setNowPlayingMessageId(null);
    }
    
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setImageFile(event.target.files[0]);
    }
  };

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e?: React.FormEvent, capturedPhotoUri?: string) => {
    if (e) {
      e.preventDefault();
    }

    if ((!input.trim() && !imageFile && !capturedPhotoUri) || isLoading) return;

    if (isRecording) {
      stopRecording();
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input,
      image: capturedPhotoUri || (imageFile ? URL.createObjectURL(imageFile) : undefined),
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    const currentImageFile = imageFile;
    setImageFile(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
    
    setIsLoading(true);

    try {
      let photoDataUri: string | undefined = capturedPhotoUri;
      if (currentImageFile) {
        photoDataUri = await fileToDataUri(currentImageFile);
      }

      const response = await answerFarmerQuestion({
        question: input || t.detection.defaultQuestion,
        photoDataUri: photoDataUri,
        city: userProfile?.city,
        language: userProfile?.language,
      });

      const aiResponseContent = response.answer ?? t.chatbot.aiResponseError;
      
      const assistantMessage: Message = {
        id: `asst-${Date.now()}`,
        role: "assistant",
        content: aiResponseContent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      speak(assistantMessage);

    } catch (error) {
      console.error("AI Error:", error);
      const assistantMessage: Message = {
        id: `asst-${Date.now()}`,
        role: "assistant",
        content: t.chatbot.aiError,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }

    setIsLoading(false);
  };

  const startRecording = () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
          toast({ variant: 'destructive', title: t.chatbot.notSupported, description: t.chatbot.notSupportedDesc });
          return;
      }
      
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }

      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = userProfile?.language === 'Hindi' ? 'hi-IN' : 'en-US';

      recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
              .map((result: any) => result[0])
              .map((result: any) => result.transcript)
              .join('');
          setInput(transcript);
      };
      
      recognitionRef.current.onend = () => {
          setIsRecording(false);
          // Use a timeout to ensure the input value is updated before submitting
          setTimeout(() => {
              const currentInput = (document.getElementById('chatbot-input') as HTMLInputElement)?.value;
              if (currentInput && currentInput.trim()) {
                  handleSubmit();
              }
          }, 100);
          recognitionRef.current = null; // Clean up
      };
      
      recognitionRef.current.onerror = (event: any) => {
          if (event.error !== 'no-speech') {
            console.error("Speech recognition error", event.error);
            toast({ variant: 'destructive', title: t.chatbot.voiceError, description: `${t.chatbot.voiceErrorDesc}${event.error}`});
          }
          setIsRecording(false);
          recognitionRef.current = null;
      };

      recognitionRef.current.start();
      setIsRecording(true);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
        recognitionRef.current.stop();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };


  const removeImage = () => {
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }
  
  const handleCameraCapture = (dataUri: string) => {
    handleSubmit(undefined, dataUri);
  }

  return (
    <div className="h-full flex justify-center">
      <CameraCaptureDialog open={isCameraOpen} onOpenChange={setIsCameraOpen} onCapture={handleCameraCapture} t={t} />
      <Card className="h-[calc(100vh-10rem)] flex flex-col w-full max-w-xl lg:max-w-4xl">
        <CardHeader className="p-4 border-b">
            <CardTitle className="flex items-center gap-2 font-headline text-lg">
                <Bot className="h-6 w-6 text-primary" /> {t.chatbot.title}
            </CardTitle>
        </CardHeader>
        <CardContent 
          className="flex-1 overflow-hidden relative"
          style={{
            backgroundImage: "url('https://plus.unsplash.com/premium_photo-1675747966994-fed6bb450c31?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-white/80 dark:bg-black/80" />
          <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
            <div className="space-y-4 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-start gap-3 animate-fade-in",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <Avatar className="h-8 w-8 border">
                      <div className="h-full w-full flex items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Bot size={20} />
                      </div>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-xs md:max-w-md p-3 rounded-lg shadow-sm relative group",
                      message.role === "user"
                        ? "bg-muted"
                        : "bg-primary text-primary-foreground"
                    )}
                  >
                     {message.role === 'assistant' && userProfile && (
                        <ShareChatDialog message={message} userProfile={userProfile} t={t} />
                     )}
                     <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -top-2 -right-2 h-7 w-7 text-primary-foreground opacity-70 group-hover:opacity-100 transition-opacity"
                        onClick={() => speak(message)}
                    >
                        {nowPlayingMessageId === message.id ? (
                            <Loader2 className="h-4 w-4 animate-spin"/>
                        ) : (
                            <Volume2 className="h-4 w-4" />
                        )}
                    </Button>
                    <div className="text-xs opacity-75 mb-1">{message.timestamp ? format(message.timestamp, "p"): ''}</div>
                    <p className="text-base whitespace-pre-wrap">{message.content}</p>
                    {message.image && (
                      <img
                        src={message.image}
                        alt="user upload"
                        className="mt-2 rounded-lg max-w-full h-auto"
                      />
                    )}
                  </div>
                  {message.role === "user" && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userProfile?.avatar || "https://picsum.photos/seed/farm-icon/40/40"} data-ai-hint="farm icon" />
                      <AvatarFallback>{userProfile?.name?.substring(0, 2) || 'U'}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-3 justify-start animate-fade-in">
                  <Avatar className="h-8 w-8 border">
                    <div className="h-full w-full flex items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Bot size={20} />
                    </div>
                  </Avatar>
                  <div className="max-w-xs p-3 rounded-lg bg-muted flex items-center gap-2 shadow-sm">
                    <Spinner className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">{t.chatbot.thinking}</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="border-t pt-2 pb-2 flex flex-col items-start gap-2">
           {imageFile && (
            <div className="relative p-1.5 border rounded-md self-start ml-1">
              <Image
                src={URL.createObjectURL(imageFile)}
                alt="Selected image"
                width={60}
                height={60}
                className="rounded-md object-cover"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
                onClick={removeImage}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          <form
            onSubmit={handleSubmit}
            className="flex w-full items-center space-x-2"
          >
            <div className="flex-1 flex items-center space-x-1 bg-muted/50 p-1.5 rounded-lg border">
                <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsCameraOpen(true)}
                disabled={isLoading}
                className="text-foreground h-8 w-8"
                >
                <Camera className="h-4 w-4" />
                <span className="sr-only">Use Camera</span>
                </Button>
                <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="text-foreground h-8 w-8"
                >
                <ImageIcon className="h-4 w-4" />
                <span className="sr-only">{t.chatbot.uploadImage}</span>
                </Button>
                <Input
                id="chatbot-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isRecording ? t.chatbot.listening : t.chatbot.placeholder}
                disabled={isLoading}
                className="bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm h-auto py-2"
                />
                <Button type="button" size="icon" onClick={toggleRecording} disabled={isLoading} variant={isRecording ? 'destructive': 'ghost'} className="text-foreground h-8 w-8">
                    <Mic className="h-4 w-4" />
                    <span className="sr-only">{t.chatbot.recordVoice}</span>
                </Button>
            </div>
            <Button type="submit" size="icon" className="h-10 w-10 shrink-0" disabled={isLoading || (!input.trim() && !imageFile)}>
              <Send className="h-4 w-4" />
            </Button>
            <Input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
              accept="image/*"
            />
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
