import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface ImageCacheDB extends DBSchema {
    'image-cache': {
        key: string;
        value: {
            url: string;
            timestamp: number;
        };
    };
}

const CACHE_EXPIRATION = 7 * 24 * 60 * 60 * 1000;

class ImageCache {
    private readonly dbPromise: Promise<IDBPDatabase<ImageCacheDB>>;

    constructor() {
        this.dbPromise = openDB<ImageCacheDB>('image-cache-db', 1, {
            upgrade(db) {
                db.createObjectStore('image-cache');
            },
        });
    }

    async getImage(key: string): Promise<string | null> {
        try {
            const db = await this.dbPromise;
            const cachedImage = await db.get('image-cache', key);

            if (!cachedImage) {
                return null;
            }

            if (Date.now() - cachedImage.timestamp > CACHE_EXPIRATION) {
                await this.removeImage(key);
                return null;
            }

            return cachedImage.url;
        } catch (error) {
            console.error('Error getting image from cache:', error);
            return null;
        }
    }

    async setImage(key: string, imageUrl: string): Promise<void> {
        try {
            const db = await this.dbPromise;
            await db.put('image-cache', { url: imageUrl, timestamp: Date.now() }, key);
        } catch (error) {
            console.error('Error caching image:', error);
        }
    }

    async removeImage(key: string): Promise<void> {
        try {
            const db = await this.dbPromise;
            await db.delete('image-cache', key);
        } catch (error) {
            console.error('Error removing image from cache:', error);
        }
    }

    async clearExpiredImages(): Promise<void> {
        try {
            const db = await this.dbPromise;
            const allKeys = await db.getAllKeys('image-cache');

            const deletePromises = allKeys.map(async (key) => {
                const cachedImage = await db.get('image-cache', key);
                if (cachedImage && Date.now() - cachedImage.timestamp > CACHE_EXPIRATION) {
                    await db.delete('image-cache', key);
                }
            });

            await Promise.all(deletePromises);
        } catch (error) {
            console.error('Error clearing expired images:', error);
        }
    }
}

const imageCache = typeof window !== 'undefined' ? new ImageCache() : null;

export const getImageFromCache = async (key: string): Promise<string | null> => {
    return imageCache ? await imageCache.getImage(key) : null;
};

export const saveImageToCache = async (key: string, imageUrl: string): Promise<void> => {
    if (imageCache) {
        await imageCache.setImage(key, imageUrl);
    }
};

export const removeImageFromCache = async (key: string): Promise<void> => {
    if (imageCache) {
        await imageCache.removeImage(key);
    }
};

export const clearExpiredImagesFromCache = async (): Promise<void> => {
    if (imageCache) {
        await imageCache.clearExpiredImages();
    }
};

export const cloudinaryImageLoader = ({ src, width }: { src: string; width: number }): string => {
    if (src.includes('cloudinary.com')) {
        const urlParts = src.split('/');
        const uploadIndex = urlParts.findIndex(part => part === 'upload');

        if (uploadIndex !== -1) {
            // Insert transformation params after 'upload'
            urlParts.splice(uploadIndex + 1, 0, `c_fill,w_${width},q_auto,f_auto`);
            return urlParts.join('/');
        }
    }

    // Return original URL if not Cloudinary or if parsing fails
    return src;
};