
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
 * Creates or overwrites a user's profile.
 * Simulates Firestore 'set' but uses localStorage for this prototyping environment.
 * @param phone The user's phone number, used as the key.
 * @param profileData The user's profile data.
 */
export const setUserProfile = async (phone: string, profileData: UserProfile): Promise<void> => {
    if (typeof window !== 'undefined') {
        const profiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
        profiles[phone] = profileData;
        localStorage.setItem('userProfiles', JSON.stringify(profiles));
        window.dispatchEvent(new Event('storage'));
    }
    return Promise.resolve();
};

/**
 * Retrieves a user's profile by phone number.
 * Simulates Firestore 'get' but uses localStorage.
 * @param phone The user's phone number.
 * @returns The user's profile data, or null if not found.
 */
export const getUserProfile = async (phone: string): Promise<UserProfile | null> => {
     if (typeof window !== 'undefined') {
        const profiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
        // Look up directly by phone number key
        if (profiles[phone]) {
            return Promise.resolve(profiles[phone]);
        }
        // Also check by email for admin login case
        const profile = Object.values(profiles).find((p: any) => p.email === phone);
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
            // Also update the currently logged in user's profile if it matches
            const currentUserProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
            if (currentUserProfile.farmerId === farmerId) {
                localStorage.setItem('userProfile', JSON.stringify(profiles[userKey]));
            }
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

// Initialize admin user if not present
if (typeof window !== 'undefined') {
    const profiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
    const adminEmail = 'admin@example.com';
    const adminExists = Object.values(profiles).some((p: any) => p.email === adminEmail);

    if (!adminExists) {
        profiles[adminEmail] = {
            farmerId: 'AD-0000-0001',
            name: 'Admin User',
            phone: '+910000000000',
            avatar: `https://picsum.photos/seed/admin/100/100`,
            farmSize: '',
            city: 'Delhi',
            state: 'Delhi',
            annualIncome: '',
            gender: '',
            age: '',
            dob: '',
            language: 'English',
            userType: 'admin',
            email: 'admin@example.com',
            status: 'active',
        };
        localStorage.setItem('userProfiles', JSON.stringify(profiles));
    }
}
