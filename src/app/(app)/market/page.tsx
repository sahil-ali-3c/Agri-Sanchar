
"use client";

import { useState, useEffect, useContext } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { indianStates } from "@/lib/indian-states";
import { indianCities } from "@/lib/indian-cities";
import { TrendingUp, MapPin, KeyRound, Leaf, Lightbulb, ShoppingCart, Award, Building, Phone, MessageSquare, Briefcase, IndianRupee, ArrowDown, ArrowUp, Minus, Package, History } from "lucide-react";
import { answerFarmerQuestion } from "@/ai/flows/answer-farmer-question";
import { Badge } from "@/components/ui/badge";
import type { PriceRecord } from "@/ai/types";
import { Spinner } from "@/components/ui/spinner";
import { useNotifications } from "@/context/notification-context";
import { useTranslation } from "@/hooks/use-translation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { getGroup, createGroup } from "@/lib/firebase/groups";
import type { UserProfile } from "@/lib/firebase/users";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { format } from 'date-fns';


type CombinedPriceData = PriceRecord & { availability?: number };
type CachedPriceData = {
    timestamp: number;
    data: CombinedPriceData[];
};


const buyerData = [
    {
        id: 'buyer-1',
        name: "Punjab Agro Traders",
        avatar: "https://picsum.photos/seed/trader-1/80/80",
        type: "Wholesaler",
        location: "Ludhiana",
        contact: "+919876512345",
        crops: [
            { name: "Wheat", price: 2150 },
            { name: "Rice", price: 3200 },
            { name: "Maize", price: 1950 },
        ],
    },
    {
        id: 'buyer-2',
        name: "Veggie Exports Inc.",
        avatar: "https://picsum.photos/seed/trader-2/80/80",
        type: "Exporter",
        location: "Chandigarh",
        contact: "+919123456789",
        crops: [
            { name: "Tomato", price: 1800 },
            { name: "Potato", price: 1650 },
            { name: "Onion", price: 2250 },
        ],
    },
    {
        id: 'buyer-3',
        name: "Desai & Sons",
        avatar: "https://picsum.photos/seed/trader-3/80/80",
        type: "Wholesaler",
        location: "Pune",
        contact: "+919988776655",
        crops: [
            { name: "Onion", price: 2300 },
            { name: "Sugarcane", price: 315 },
            { name: "Grapes", price: 8500 },
        ],
    },
    {
        id: 'buyer-4',
        name: "National Food Processors",
        avatar: "https://picsum.photos/seed/trader-4/80/80",
        type: "Food Processor",
        location: "Nagpur",
        contact: "+9112233445",
        crops: [
            { name: "Orange", price: 4200 },
            { name: "Soybean", price: 4850 },
            { name: "Cotton", price: 7100 },
        ],
    }
]


export default function MarketPricesPage() {
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [prices, setPrices] = useState<CombinedPriceData[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<{type: 'live' | 'cached', timestamp?: number} | null>(null);

  const { addNotification } = useNotifications();
  const [isAllIndia, setIsAllIndia] = useState(true);
  const { t, isLoaded } = useTranslation();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    const savedProfile = localStorage.getItem("userProfile");
    let initialCity: string | null = null;
    let doFetch = true;

    if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile);
      setUserProfile(parsedProfile);
      if (parsedProfile.state) {
        const userState = parsedProfile.state;
        const cities = indianCities[userState] || [];
        setAvailableCities(cities);
        setSelectedState(userState);
        if (parsedProfile.city && cities.includes(parsedProfile.city)) {
            setSelectedCity(parsedProfile.city);
            initialCity = parsedProfile.city;
            setIsAllIndia(false);
        }
      }
    }
    
    if (initialCity) {
      fetchPrices(initialCity);
    } else {
      fetchPrices(null);
    }

  }, [isLoaded]);

  const fetchPrices = async (city: string | null) => {
    setIsLoading(true);
    setPrices(null);
    setError(null);
    setDataSource(null);

    const locationKey = city || 'all_india';
    const locationName = city || t.market.allIndia;

    try {
        const response = await answerFarmerQuestion({
            question: `Get prices for ${locationName}`,
            city: city || undefined,
            returnJson: true,
        });

        if (response.priceData && response.priceData.length > 0) {
            const pricesWithAvailability: CombinedPriceData[] = response.priceData.map(p => ({
                ...p,
                availability: Math.floor(Math.random() * 80) + 20
            }));
            setPrices(pricesWithAvailability);
            setDataSource({ type: 'live' });
            localStorage.setItem(`market_prices_${locationKey}`, JSON.stringify({ timestamp: Date.now(), data: pricesWithAvailability }));
            addNotification({
                title: t.market.notification.updated,
                description: t.market.notification.loaded(locationName),
            });
        } else {
            throw new Error(response.answer || 'No data received from API');
        }
    } catch (e: any) {
        console.error("Live API fetch failed:", e);

        // Fallback to cache
        const cachedDataString = localStorage.getItem(`market_prices_${locationKey}`);
        if (cachedDataString) {
            const cachedData: CachedPriceData = JSON.parse(cachedDataString);
            setPrices(cachedData.data);
            setDataSource({ type: 'cached', timestamp: cachedData.timestamp });
            addNotification({ title: "Showing Cached Prices", description: `Live data unavailable for ${locationName}.`});
        } else {
            // If no live data and no cache, set error
             if (e.message.includes('API_KEY_MISSING')) {
                setError('API_KEY_MISSING');
            } else {
                setError(t.market.error.noData(locationName));
            }
            setPrices([]);
        }
    } finally {
        setIsLoading(false);
        setIsAllIndia(city === null);
    }
};

  const handleStateChange = (value: string) => {
    setSelectedState(value);
    setSelectedCity("");
    const cities = indianCities[value] || [];
    setAvailableCities(cities);
    setPrices(null);
    setError(null);
    fetchPrices(null);
  };

  const handleCityChange = (value: string) => {
    setSelectedCity(value);
    if (value === 'all') {
      fetchPrices(null);
    } else {
      fetchPrices(value);
    }
  };
  
  const handleChat = (buyer: (typeof buyerData)[0]) => {
      if (!userProfile) {
          return;
      }

      const dmGroupId = `dm-${userProfile.farmerId}-${buyer.id}`;
      const existingDm = getGroup(dmGroupId);

      if (existingDm) {
          router.push(`/community/${dmGroupId}`);
          return;
      }

      const newDmGroup = createGroup({
          id: dmGroupId,
          name: `Chat with ${buyer.name}`,
          description: `Direct message channel between ${userProfile.name} and ${buyer.name}.`,
          city: userProfile.city,
          ownerId: userProfile.farmerId,
          members: [userProfile.farmerId, buyer.id],
          createdBy: userProfile.name,
          avatarUrl: buyer.avatar,
      });

      router.push(`/community/${newDmGroup.id}`);
  };

  const getPriceComparison = (commodity: string) => {
      if (!prices) return { marketPrice: null };
      const marketRecord = prices.find(p => p.commodity.toLowerCase() === commodity.toLowerCase());
      return {
          marketPrice: marketRecord ? parseInt(marketRecord.modal_price) : null,
      };
  };
  
    const getAvailabilityColor = (percentage: number) => {
        if (percentage > 75) return "bg-green-500";
        if (percentage > 40) return "bg-yellow-500";
        return "bg-red-500";
    }

  const PriceComparisonRow = ({ buyerPrice, marketPrice, cropName }: { buyerPrice: number, marketPrice: number | null, cropName: string }) => {
    let comparisonIcon = <Minus className="h-4 w-4 text-muted-foreground" />;
    let priceColor = 'text-muted-foreground';
    let marketPriceText: string | number;

    if (marketPrice !== null) {
        marketPriceText = marketPrice.toLocaleString("en-IN");
        if (buyerPrice > marketPrice) {
            comparisonIcon = <ArrowUp className="h-4 w-4 text-green-500" />;
            priceColor = 'text-green-600';
        } else if (buyerPrice < marketPrice) {
            comparisonIcon = <ArrowDown className="h-4 w-4 text-red-500" />;
            priceColor = 'text-red-600';
        }
    } else {
        marketPriceText = buyerPrice.toLocaleString("en-IN"); // Fallback to buyer price
    }


    return (
        <div className="flex justify-between items-center text-sm p-1.5 bg-muted/50 rounded-md">
            <span className="font-medium">{cropName}</span>
            <div className="flex items-center gap-3">
                 <div className={cn("font-bold flex items-center", priceColor)}>
                    <span className="text-xs mr-1">{t.market.strategy.offer}:</span>
                    <IndianRupee className="h-3.5 w-3.5 mr-0.5"/>
                    {buyerPrice.toLocaleString("en-IN")}
                </div>
                <div className="flex items-center text-muted-foreground">
                    {comparisonIcon}
                </div>
                <div className="font-bold flex items-center text-muted-foreground w-[80px] justify-end">
                    <span className="text-xs mr-1">{t.market.strategy.market}:</span>
                    <IndianRupee className="h-3.5 w-3.5 mr-0.5"/>
                    {marketPriceText}
                </div>
            </div>
        </div>
    );
};


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">{t.market.title}</h1>
        <p className="text-muted-foreground">
          {t.market.description}
        </p>
      </div>

       <Tabs defaultValue="prices" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="prices">{t.market.tabs.prices}</TabsTrigger>
                <TabsTrigger value="strategy">{t.market.tabs.strategy}</TabsTrigger>
            </TabsList>
            <TabsContent value="prices" className="pt-4 space-y-6">
                 <Card>
                    <CardHeader>
                    <CardTitle>{t.market.locationTitle}</CardTitle>
                    <CardDescription>
                        {t.market.locationDescription}
                    </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select onValueChange={handleStateChange} value={selectedState}>
                        <SelectTrigger>
                        <SelectValue placeholder={t.market.statePlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                        {indianStates.map((state) => (
                            <SelectItem key={state} value={state}>
                            {state}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <Select
                        onValueChange={handleCityChange}
                        value={selectedCity}
                        disabled={!selectedState || isLoading}
                    >
                        <SelectTrigger>
                        <SelectValue placeholder={t.market.cityPlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="all">{t.market.allIndia}</SelectItem>
                        {availableCities.map((city) => (
                            <SelectItem key={city} value={city}>
                            {city}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    </CardContent>
                </Card>

                <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-headline">
                    <TrendingUp className="h-6 w-6 text-primary" /> {t.market.pricesFor(selectedCity || t.market.allIndia)}
                    </CardTitle>
                    <CardDescription>
                    {t.market.pricesDescription}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading && (
                    <div className="flex justify-center items-center py-8">
                        <Spinner className="h-8 w-8 text-primary" />
                        <p className="ml-2 text-muted-foreground">{t.market.fetching}</p>
                    </div>
                    )}
                    
                    {dataSource?.type === 'cached' && dataSource.timestamp && (
                        <Alert variant="default" className="mb-4 bg-amber-50 border-amber-200">
                             <History className="h-4 w-4 !text-amber-700" />
                            <AlertTitle className="text-amber-800">Showing Cached Data</AlertTitle>
                            <AlertDescription className="text-amber-700">
                                Live data is currently unavailable. Displaying prices from {format(new Date(dataSource.timestamp), "PPP p")}.
                            </AlertDescription>
                        </Alert>
                    )}

                    {error && error === 'API_KEY_MISSING' ? (
                        <Alert variant="destructive">
                            <KeyRound className="h-4 w-4" />
                            <AlertTitle>{t.market.error.apiKeyTitle}</AlertTitle>
                            <AlertDescription>
                                {t.market.error.apiKeyDesc}
                                <pre className="mt-2 rounded-md bg-muted p-2 text-xs">GOV_DATA_API_KEY=YOUR_API_KEY_HERE</pre>
                            </AlertDescription>
                        </Alert>
                    ) : error && (
                    <div className="text-center py-8 text-destructive">
                        <p>{error}</p>
                    </div>
                    )}
                    {!isLoading && !error && prices && prices.length > 0 && (
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>{t.market.table.crop}</TableHead>
                            {isAllIndia && <TableHead>{t.market.table.market}</TableHead>}
                            <TableHead>Availability</TableHead>
                            <TableHead className="text-right">{t.market.table.currentPrice}</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {prices.map((crop, index) => (
                            <TableRow key={index}>
                            <TableCell className="font-medium">{crop.commodity}</TableCell>
                            {isAllIndia && <TableCell>{crop.market}</TableCell>}
                            <TableCell>
                                {crop.availability !== undefined && (
                                    <div className="flex items-center gap-2">
                                        <Progress value={crop.availability} className={cn("h-2 w-16", getAvailabilityColor(crop.availability))} />
                                        <span className="text-xs font-medium text-muted-foreground">{crop.availability}%</span>
                                    </div>
                                )}
                            </TableCell>
                            <TableCell className="text-right font-bold">
                                {parseInt(crop.modal_price).toLocaleString("en-IN")}
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    )}
                    {!isLoading && !error && prices?.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>{t.market.error.noPriceData(selectedCity || t.market.allIndia)}</p>
                    </div>
                    )}
                </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="strategy" className="pt-4 space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>{t.market.strategy.findBuyers}</CardTitle>
                        <CardDescription>{t.market.strategy.findBuyersDesc}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        {buyerData.map((buyer) => (
                            <Card key={buyer.id}>
                                <CardHeader className="flex flex-row items-center gap-4">
                                    <Avatar className="h-16 w-16">
                                        <AvatarImage src={buyer.avatar} />
                                        <AvatarFallback>{buyer.name.substring(0,2)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <CardTitle className="text-lg">{buyer.name}</CardTitle>
                                        <p className="text-sm text-muted-foreground">{buyer.type} - {buyer.location}</p>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm font-semibold mb-2">{t.market.strategy.priceComparison}:</p>
                                    <div className="space-y-1">
                                         {buyer.crops.map(({name, price}) => {
                                            const { marketPrice } = getPriceComparison(name);
                                            return (
                                                <PriceComparisonRow
                                                    key={name}
                                                    buyerPrice={price}
                                                    marketPrice={marketPrice}
                                                    cropName={name}
                                                />
                                            );
                                        })}
                                    </div>
                                </CardContent>
                                <CardFooter className="grid grid-cols-2 gap-2">
                                    <Button variant="outline" asChild>
                                        <a href={`tel:${buyer.contact}`}>
                                            <Phone className="mr-2 h-4 w-4" /> {t.market.strategy.call}
                                        </a>
                                    </Button>
                                    <Button onClick={() => handleChat(buyer)}>
                                        <MessageSquare className="mr-2 h-4 w-4"/> {t.market.strategy.chat}
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}
