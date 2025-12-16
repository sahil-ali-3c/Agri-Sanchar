
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Languages } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { Spinner } from '@/components/ui/spinner';

function WelcomeContent() {
    const router = useRouter();
    const { t, setLanguage } = useTranslation();

    useEffect(() => {
        const storedLang = localStorage.getItem('selectedLanguage');
        if (storedLang) {
            router.push('/login');
        }
    }, [router]);

    const handleLanguageSelect = (language: 'English' | 'Hindi') => {
        setLanguage(language);
        router.push('/login');
    };

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center p-4 overflow-hidden"
             style={{
                backgroundImage: "url('https://cdn.pixabay.com/photo/2017/07/06/12/56/morning-2477957_1280.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center'
             }}
        >
            <div className="absolute inset-0 bg-black/50 -z-10" />

            <Card className="w-full max-w-sm animate-fade-in bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-headline flex items-center justify-center gap-2">
                        <Languages className="h-6 w-6"/> {t.languageSelection.title}
                    </CardTitle>
                    <CardDescription className="text-white/80">
                        {t.languageSelection.description}
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                     <Button 
                        variant="outline" 
                        className="h-20 text-lg bg-white/20 hover:bg-white/30 border-white/30"
                        onClick={() => handleLanguageSelect('English')}
                    >
                        English
                    </Button>
                    <Button 
                        variant="outline" 
                        className="h-20 text-lg font-headline bg-white/20 hover:bg-white/30 border-white/30"
                        onClick={() => handleLanguageSelect('Hindi')}
                    >
                        हिन्दी
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}


export default function WelcomePage() {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return isClient ? <WelcomeContent /> : (
         <div className="relative flex min-h-screen flex-col items-center justify-center p-4 overflow-hidden"
             style={{
                backgroundImage: "url('https://cdn.pixabay.com/photo/2017/07/06/12/56/morning-2477957_1280.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center'
             }}
        >
            <div className="absolute inset-0 bg-black/50 -z-10" />
            <Spinner className="h-12 w-12 text-white" />
        </div>
    );
}
