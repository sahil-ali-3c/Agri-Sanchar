
import { v4 as uuidv4 } from 'uuid';

// Types
export type Comment = {
    author: string;
    content: string;
    isAi?: boolean;
    isExpert?: boolean;
    avatar: string;
};

export type Post = {
    id: number;
    author: string;
    avatar: string;
    avatarHint?: string;
    location: string;
    category: string;
    categoryColor: string;
    time: string;
    title: string;
    content: string;
    image: string | null;
    imageHint?: string;
    mediaType: string | null;
    likes: number;
    comments: Comment[];
    originalAuthor?: string;
};

const POSTS_STORAGE_KEY = 'community_posts';

const initialPostsData: Post[] = [
  {
    id: 1,
    author: "Balwinder Singh",
    avatar: "https://picsum.photos/seed/wheat-field/40/40",
    avatarHint: "wheat field",
    location: "Amritsar",
    category: "Pests",
    categoryColor: "bg-red-500",
    time: "2 hours ago",
    title: "What is this on my wheat crop?",
    content:
      "My wheat crop is showing yellow spots on the leaves. What could be the issue? I've attached a photo.",
    image: "https://images.unsplash.com/photo-1437252611977-07f74518abd7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHx3aGVhdHxlbnwwfHx8fDE3NTg0NjMyMjd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    imageHint: "wheat disease",
    mediaType: 'image',
    likes: 12,
    comments: [
      { author: "AI Expert", content: "This looks like a nitrogen deficiency. Try applying a urea-based fertilizer.", isAi: true, isExpert: true, avatar: '' },
      { author: "Gurpreet Kaur", content: "I had a similar issue. It was rust disease. Check for orange pustules.", avatar: 'https://picsum.photos/seed/farm-avatar-2/40/40' },
    ],
  },
  {
    id: 2,
    author: "Rani Devi",
    avatar: "https://picsum.photos/seed/rice-field/40/40",
    avatarHint: "rice field",
    location: "Ludhiana",
    category: "Crops",
    categoryColor: "bg-green-500",
    time: "5 hours ago",
    title: "Healthy rice paddy this season!",
    content: "Sharing a picture of my healthy rice paddy this season! Good rainfall has helped a lot. How is everyone else's crop?",
    image: "https://images.unsplash.com/photo-1562918105-15a13eef89ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxyaWNlJTIwcGFkZHl8ZW58MHx8fHwxNzU4NDY2OTE0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    imageHint: "rice paddy",
    mediaType: 'image',
    likes: 28,
    comments: [
        { author: "Sukhdev Singh", content: "Looks great, Rani ji! My crop is also doing well.", avatar: 'https://picsum.photos/seed/farm-avatar-3/40/40' },
    ],
  },
   {
    id: 3,
    author: "Manpreet Kaur",
    avatar: "https://picsum.photos/seed/tractor-purchase/40/40",
    avatarHint: "tractor",
    location: "Patiala",
    category: "Equipment",
    categoryColor: "bg-blue-500",
    time: "1 day ago",
    title: "Advice on buying a new tractor?",
    content: "I'm planning to buy a new tractor for my 15-acre farm. Any recommendations on brands or models? My budget is around ₹6 lakh.",
    image: 'https://images.unsplash.com/photo-1614977645540-7abd88ba8e56?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHx0cmFjdG9yfGVufDB8fHx8MTc1ODM3Njk0NHww&ixlib=rb-4.1.0&q=80&w=1080',
    mediaType: 'image',
    imageHint: 'new tractor',
    likes: 18,
    comments: [],
  },
  {
    id: 4,
    author: "Vikram Kumar",
    avatar: "https://picsum.photos/seed/vegetable-farm/40/40",
    avatarHint: "vegetable farm",
    location: "Jalandhar",
    category: "Market",
    categoryColor: "bg-orange-500",
    time: "2 days ago",
    title: "Great prices for tomatoes at Jalandhar mandi!",
    content: "Just sold my tomato harvest at the Jalandhar mandi for a very good price. Demand is high right now. If you have ready produce, now is a good time to sell.",
    image: "https://images.unsplash.com/photo-1598512752271-33f913a5af13?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    imageHint: "tomatoes market",
    mediaType: 'image',
    likes: 45,
    comments: [],
  },
];


// --- LocalStorage Posts Service (Simulation) ---

// Helper to get posts from localStorage
export const getStoredPosts = (): Post[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(POSTS_STORAGE_KEY);
    
    if (!stored) {
        localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(initialPostsData));
        return initialPostsData;
    }
    
    return JSON.parse(stored);
};

// Helper to save posts to localStorage
const setStoredPosts = (posts: Post[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
    // Dispatch a storage event to notify other tabs/components
    window.dispatchEvent(new Event('storage'));
};

/**
 * Fetches all posts from storage.
 */
export const getPosts = (): Post[] => {
    const posts = getStoredPosts();
    return posts.sort((a, b) => b.id - a.id); // Sort by most recent
};

/**
 * Adds a new post to storage.
 */
export const addPost = (newPost: Post): Post => {
    const posts = getStoredPosts();
    const updatedPosts = [newPost, ...posts];
    setStoredPosts(updatedPosts);
    return newPost;
};

/**
 * Updates a post in storage (e.g., for likes or comments).
 */
export const updatePost = (postId: number, updates: Partial<Post>): Post | null => {
    const posts = getStoredPosts();
    const postIndex = posts.findIndex(p => p.id === postId);

    if (postIndex === -1) {
        console.error("Post not found for update");
        return null;
    }

    const updatedPost = { ...posts[postIndex], ...updates };
    posts[postIndex] = updatedPost;
    setStoredPosts(posts);

    return updatedPost;
};
