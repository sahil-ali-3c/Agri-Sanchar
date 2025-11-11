
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { setDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';

export interface UserProfile {
    farmerId: string;
    name: string;
    phone: string;
    avatar: string;
    farmSize: string;
    city: string;
    state: string;
    annualIncome: string;
    gender: string;
    age: string;
    dob: string;
    language: 'English' | 'Hindi';
    userType: 'farmer' | 'expert' | 'ngo' | 'admin';
    specialization?: string;
    organization?: string;
    email?: string;
    status?: 'active' | 'suspended';
}


/**
 * Creates or overwrites a user's profile in Firestore.
 * @param userId The user's authentication ID from Firebase Auth.
 * @param profileData The user's profile data.
 */
export const setUserProfile = async (userId: string, profileData: UserProfile): Promise<void> => {
    // For simulation, we are using a local cache. In a real app, this would be a direct Firestore call.
    // The `userId` here is the simulated one like 'sim-9876543210' or the admin's email.
    if (typeof window !== 'undefined') {
        const profiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
        profiles[userId] = profileData;
        localStorage.setItem('userProfiles', JSON.stringify(profiles));
        window.dispatchEvent(new Event('storage'));
    }
    return Promise.resolve();
};

/**
 * Retrieves a user's profile from Firestore.
 * @param userId The user's authentication ID.
 * @returns The user's profile data, or null if not found.
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
     if (typeof window !== 'undefined') {
        const profiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
        if (profiles[userId]) {
            return Promise.resolve(profiles[userId]);
        }
        // Also check by email for admin login case
        const profile = Object.values(profiles).find((p: any) => p.email === userId);
        return Promise.resolve(profile as UserProfile || null);
    }
    return Promise.resolve(null);
};

/**
 * Retrieves all user profiles from Firestore.
 * @returns An array of all user profiles.
 */
export const getUsers = async (): Promise<UserProfile[]> => {
    if (typeof window !== 'undefined') {
        const profiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
        return Promise.resolve(Object.values(profiles));
    }
    return Promise.resolve([]);
};


/**
 * Updates a user's profile in Firestore.
 * @param farmerId The user's unique farmerId.
 * @param updates The fields to update.
 */
export const updateUserProfile = async (farmerId: string, updates: Partial<UserProfile>): Promise<void> => {
    if (typeof window !== 'undefined') {
        const profiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
        const userKey = Object.keys(profiles).find(key => profiles[key].farmerId === farmerId);
        if (userKey) {
            profiles[userKey] = { ...profiles[userKey], ...updates };
            localStorage.setItem('userProfiles', JSON.stringify(profiles));
            window.dispatchEvent(new Event('storage'));
            return Promise.resolve();
        } else {
            return Promise.reject(new Error("User not found"));
        }
    }
};

/**
 * Deletes a user's profile from Firestore.
 * @param farmerId The auth ID of the user to delete.
 */
export const deleteUserProfile = async (farmerId: string): Promise<void> => {
    if (typeof window !== 'undefined') {
        const profiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
        const userKey = Object.keys(profiles).find(key => profiles[key].farmerId === farmerId);
        
        if (userKey) {
            if (profiles[userKey].userType === 'admin') {
                return Promise.reject(new Error("Cannot delete admin user."));
            }
            delete profiles[userKey];
            localStorage.setItem('userProfiles', JSON.stringify(profiles));
            window.dispatchEvent(new Event('storage'));
            return Promise.resolve();
        } else {
            return Promise.reject(new Error("User not found"));
        }
    }
};
