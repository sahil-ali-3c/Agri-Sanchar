
import { Leaf } from "lucide-react";
import Image from "next/image";
import { FirebaseClientProvider } from "@/firebase/client-provider";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
        <div className="relative flex min-h-screen flex-col items-center justify-center p-4 overflow-hidden">
            <Image
            src="https://cdn.pixabay.com/photo/2017/07/06/12/56/morning-2477957_1280.jpg"
            alt="Misty morning on a farm"
            fill
            className="object-cover -z-20"
            data-ai-hint="farm morning"
            />
            <div className="absolute inset-0 bg-black/50 -z-10" />

        <div className="mb-6 flex items-center gap-2 text-3xl font-bold text-white drop-shadow-lg">
            <Leaf className="h-8 w-8 text-white" />
            <h1 className="font-headline">Agri-Sanchar</h1>
        </div>
        {children}
        </div>
    </FirebaseClientProvider>
  );
}
