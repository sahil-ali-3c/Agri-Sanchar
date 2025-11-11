
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
    const userDocRef = doc(db, 'users', userId);
    setDocumentNonBlocking(userDocRef, profileData, { merge: true });
};

/**
 * Retrieves a user's profile from Firestore.
 * @param userId The user's authentication ID.
 * @returns The user's profile data, or null if not found.
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
    }
    return null;
};

/**
 * Retrieves all user profiles from Firestore.
 * @returns An array of all user profiles.
 */
export const getUsers = async (): Promise<UserProfile[]> => {
    const usersCollectionRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersCollectionRef);
    const users: UserProfile[] = [];
    querySnapshot.forEach((doc) => {
        // We need a unique identifier for each user in the admin panel,
        // and the doc id is the auth uid which is perfect.
        users.push({ ...(doc.data() as UserProfile), farmerId: doc.id });
    });
    return users;
};


/**
 * Updates a user's profile in Firestore.
 * @param userId The user's auth ID.
 * @param updates The fields to update.
 */
export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<void> => {
    const userDocRef = doc(db, 'users', userId);
    updateDocumentNonBlocking(userDocRef, updates);
};

/**
 * Deletes a user's profile from Firestore.
 * @param userId The auth ID of the user to delete.
 */
export const deleteUserProfile = async (userId: string): Promise<void> => {
    const userDocRef = doc(db, 'users', userId);
    // In a real app, you might want to prevent deletion of certain users, e.g., admins.
    const user = await getUserProfile(userId);
    if (user?.userType === 'admin') {
      throw new Error("Cannot delete admin user.");
    }
    deleteDocumentNonBlocking(userDocRef);
};
