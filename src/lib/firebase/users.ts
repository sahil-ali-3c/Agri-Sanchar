
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
    status?: 'active' | 'suspended'; // Added status
}

// In-memory/localStorage cache for user profiles to support simulation
let userProfiles: { [key: string]: UserProfile } = {};

if (typeof window !== 'undefined') {
    const storedProfiles = localStorage.getItem('userProfiles');
    if (storedProfiles) {
        userProfiles = JSON.parse(storedProfiles);
    } 
    
    // Always ensure the admin user exists with the correct key
    const adminId = 'admin@example.com';
    if (!userProfiles[adminId]) {
        userProfiles[adminId] = {
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
        localStorage.setItem('userProfiles', JSON.stringify(userProfiles));
    }
}

const saveProfilesToLocalStorage = () => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('userProfiles', JSON.stringify(userProfiles));
        window.dispatchEvent(new Event('storage')); // Notify other components of changes
    }
};

/**
 * Creates or overwrites a user's profile.
 * Simulates Firestore 'set' but uses localStorage for this prototyping environment.
 * @param userId The user's authentication ID (or simulated ID).
 * @param profileData The user's profile data.
 */
export const setUserProfile = async (userId: string, profileData: UserProfile): Promise<void> => {
    userProfiles[userId] = { ...profileData, status: profileData.status || 'active' };
    saveProfilesToLocalStorage();
    return Promise.resolve();
};

/**
 * Retrieves a user's profile.
 * Simulates Firestore 'get' but uses localStorage.
 * @param userId The user's authentication ID (or simulated ID).
 * @returns The user's profile data, or null if not found.
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const profile = Object.values(userProfiles).find(p => p.farmerId === userId || p.email === userId);
    return Promise.resolve(profile || null);
};


/**
 * Retrieves all user profiles.
 * @returns An array of all user profiles.
 */
export const getUsers = async (): Promise<UserProfile[]> => {
    return Promise.resolve(Object.values(userProfiles));
}

/**
 * Updates a user's profile.
 * Simulates Firestore 'update' but uses localStorage.
 * @param farmerId The user's farmerId.
 * @param updates The fields to update.
 */
export const updateUserProfile = async (farmerId: string, updates: Partial<UserProfile>): Promise<void> => {
    // Find the key of the user to update
    const userKey = Object.keys(userProfiles).find(key => userProfiles[key].farmerId === farmerId);

    if (userKey) {
        userProfiles[userKey] = { ...userProfiles[userKey], ...updates };
        saveProfilesToLocalStorage();
        return Promise.resolve();
    } else {
        return Promise.reject(new Error("User not found"));
    }
};

/**
 * Deletes a user's profile from localStorage.
 * @param farmerId The farmerId of the user to delete.
 */
export const deleteUserProfile = async (farmerId: string): Promise<void> => {
    const userKey = Object.keys(userProfiles).find(key => userProfiles[key].farmerId === farmerId);
    
    if (userKey) {
        // Prevent admin from being deleted
        if (userProfiles[userKey].userType === 'admin') {
            return Promise.reject(new Error("Cannot delete admin user."));
        }
        delete userProfiles[userKey];
        saveProfilesToLocalStorage();
        return Promise.resolve();
    } else {
        return Promise.reject(new Error("User not found"));
    }
};
