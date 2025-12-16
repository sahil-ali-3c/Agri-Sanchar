
"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sun, CloudRain, CloudSun, Cloudy, Moon, Wind, Droplets, Thermometer, Haze, Sunrise, Sunset, Gauge, Bot, KeyRound, Volume2, Loader2 } from "lucide-react";
import { useNotifications } from "@/context/notification-context";
import { getWeatherForecast } from "@/ai/flows/get-weather-forecast";
import { type WeatherForecastOutput } from "@/ai/types";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";


const ICONS: { [key: string]: React.ElementType } = {
    "sun": Sun,
    "rain": CloudRain,
    "clouds": Cloudy,
    "clear": Sun, 
    "haze": Haze,
    "smoke": Wind,
    "mist": Droplets,
    "drizzle": CloudRain,
    "snow": Thermometer, // Placeholder
    "thunderstorm": CloudRain, // Placeholder
    "default": CloudSun,
};

const getIcon = (condition: string): React.ElementType => {
    const lowerCaseCondition = condition.toLowerCase();
    for (const key in ICONS) {
        if (lowerCaseCondition.includes(key)) {
            return ICONS[key];
        }
    }
    return ICONS.default;
}

export default function WeatherPage() {
    const [city, setCity] = useState("Ludhiana");
    const [state, setState] = useState("Punjab");
    const [weatherData, setWeatherData] = useState<WeatherForecastOutput | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { addNotification } = useNotifications();
    const { t, language } = useTranslation();

    // TTS State
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        const fetchWeatherData = async () => {
            setIsLoading(true);
            setError(null);
            
            let userCity = 'Ludhiana';
            let userState = 'Punjab';

            const savedProfile = localStorage.getItem("userProfile");
            if (savedProfile) {
                const parsedProfile = JSON.parse(savedProfile);
                userCity = parsedProfile.city || 'Ludhiana';
                userState = parsedProfile.state || 'Punjab';
            }
            
            setCity(userCity);
            setState(userState);

            try {
                const forecast = await getWeatherForecast({ city: userCity, language: language });

                if (forecast.error) {
                    setError(forecast.error);
                    if (!forecast.error.includes("API key")) {
                        addNotification({
                            title: t.weather.notification.unavailable,
                            description: forecast.error,
                        });
                    }
                } else {
                    setWeatherData(forecast);
                    addNotification({
                        title: t.weather.notification.alert,
                        description: t.weather.notification.loaded(userCity, forecast.current?.condition || "N/A")
                    });
                }
            } catch (e) {
                const errorMessage = t.weather.error.fetchFailed;
                setError(errorMessage);
                 addNotification({
                    title: t.weather.error.title,
                    description: errorMessage
                });
                console.error(e);
            }
            setIsLoading(false);
        };

        fetchWeatherData();
    }, [addNotification, t, language]);

     useEffect(() => {
        const populateVoiceList = () => {
            if (typeof window === 'undefined' || !window.speechSynthesis) return;
            const availableVoices = window.speechSynthesis.getVoices();
            if (availableVoices.length > 0) {
                setVoices(availableVoices);
                window.speechSynthesis.onvoiceschanged = null;
            }
        };

        populateVoiceList();
        if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = populateVoiceList;
        }

        return () => {
            if (typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const speak = (text: string) => {
        if (isPlaying) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
            return;
        }

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        const targetLang = language === 'Hindi' ? 'hi-IN' : 'en-US';
        utterance.lang = targetLang;

        let selectedVoice = null;
        if (targetLang === 'hi-IN') {
            selectedVoice = voices.find(voice => voice.lang === 'hi-IN' && voice.name.includes('Google')) 
                         || voices.find(voice => voice.lang === 'hi-IN');
        } else {
            selectedVoice = voices.find(voice => voice.lang.startsWith('en-') && voice.name.includes('Google'))
                         || voices.find(voice => voice.lang.startsWith('en-'));
        }
        
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        utterance.onstart = () => setIsPlaying(true);
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = (e) => {
            if (e.error !== 'canceled' && e.error !== 'interrupted') {
                console.error("Speech synthesis error", e);
            }
            setIsPlaying(false);
        };
        
        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    };


  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold font-headline">{t.weather.title}</h1>
        <p className="text-muted-foreground">{t.weather.subtitle(city, state)}</p>
      </div>

       {isLoading && (
            <div className="flex justify-center items-center py-16">
                <Spinner className="h-10 w-10 text-primary" />
                <p className="ml-3 text-muted-foreground">{t.weather.loading}</p>
            </div>
        )}

        {error && !isLoading && (
             error.includes("API key") ? (
                <Alert variant="destructive">
                    <KeyRound className="h-4 w-4" />
                    <AlertTitle>{t.weather.error.apiKeyTitle}</AlertTitle>
                    <AlertDescription>
                        {t.weather.error.apiKeyDesc1}
                        <pre className="mt-2 rounded-md bg-muted p-2 text-xs">OPENWEATHER_API_KEY=YOUR_API_KEY_HERE</pre>
                    </AlertDescription>
                </Alert>
             ) : (
                <Alert variant="destructive">
                    <AlertTitle>{t.weather.error.title}</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
             )
        )}

      {!isLoading && !error && weatherData && (
          <>
          <Card>
            <CardHeader>
                <CardTitle>{t.weather.current.title}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-primary/5 border gap-2">
                    <p className="font-semibold text-primary/80">{t.weather.current.realFeel}</p>
                    <Thermometer className="w-10 h-10 text-primary"/>
                    <p className="text-2xl font-bold">{weatherData.current?.realFeel}</p>
                </div>
                <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-primary/5 border gap-2">
                    <p className="font-semibold text-primary/80">{t.weather.current.humidity}</p>
                    <Droplets className="w-10 h-10 text-primary"/>
                    <p className="text-2xl font-bold">{weatherData.current?.humidity}</p>
                </div>
                 <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-primary/5 border gap-2">
                    <p className="font-semibold text-primary/80">{t.weather.current.wind}</p>
                    <Wind className="w-10 h-10 text-primary"/>
                    <p className="text-2xl font-bold">{weatherData.current?.windSpeed}</p>
                </div>
                 <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-primary/5 border gap-2">
                    <p className="font-semibold text-primary/80">{t.weather.current.pressure}</p>
                    <Gauge className="w-10 h-10 text-primary"/>
                    <p className="text-lg font-bold">{weatherData.current?.pressure}</p>
                </div>
            </CardContent>
          </Card>
          
          {weatherData.farmingTips && (
            <Card className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-2 font-headline text-green-800 dark:text-green-300">
                            <Bot className="h-6 w-6" /> {t.weather.aiSuggestion}
                        </CardTitle>
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => speak(weatherData.farmingTips || '')}
                            className="text-green-800 dark:text-green-300"
                        >
                            {isPlaying ? <Loader2 className="h-5 w-5 animate-spin" /> : <Volume2 className="h-5 w-5" />}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-green-900 dark:text-green-200 whitespace-pre-wrap">{weatherData.farmingTips}</div>
                </CardContent>
            </Card>
          )}


            <Tabs defaultValue="weekly" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-sm">
                <TabsTrigger value="daily">{t.weather.tabs.today}</TabsTrigger>
                <TabsTrigger value="weekly">{t.weather.tabs.weekly}</TabsTrigger>
                </TabsList>
                <TabsContent value="daily">
                <Card>
                    <CardHeader>
                    <CardTitle className="font-headline flex items-center justify-between">
                      <span>{t.weather.forecast.today}</span>
                      {weatherData.current?.temp && (
                        <span className="text-2xl font-bold text-primary">{weatherData.current.temp}</span>
                      )}
                    </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {weatherData.daily?.map((forecast) => {
                        const Icon = getIcon(forecast.condition);
                        return (
                            <div
                            key={forecast.time}
                            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-primary/5 border "
                            >
                            <p className="font-semibold text-primary/80">{forecast.time}</p>
                            <Icon className="w-12 h-12 text-primary" />
                            <p className="text-2xl font-bold">{forecast.temp}</p>
                            <p className="text-sm text-muted-foreground">
                                {forecast.condition}
                            </p>
                            </div>
                        )
                    })}
                    </CardContent>
                </Card>
                </TabsContent>
                <TabsContent value="weekly">
                <Card>
                    <CardHeader>
                    <CardTitle className="font-headline">{t.weather.forecast.weekly}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                    {weatherData.weekly?.map((forecast) => {
                        const Icon = getIcon(forecast.condition);
                        return (
                            <div
                            key={forecast.day}
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                            <p className="font-semibold basis-1/4">{forecast.day}</p>
                            <div className="flex items-center gap-2 basis-1/2 justify-center">
                                <Icon className="w-6 h-6 text-primary" />
                                <p className="text-muted-foreground">{forecast.condition}</p>
                            </div>
                            <p className="font-bold text-lg basis-1/4 text-right">
                                {forecast.temp}
                            </p>
                            </div>
                        )
                    })}
                    </CardContent>
                </Card>
                </TabsContent>
            </Tabs>
        </>
      )}
    </div>
  );
}
