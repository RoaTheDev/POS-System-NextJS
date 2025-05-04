'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Package } from 'lucide-react';
import { theme } from '@/lib/colorPattern';
import { cloudinaryImageLoader, getImageFromCache, saveImageToCache } from '@/lib/cache/imageCache';

interface CachedImageProps {
    src?: string;
    alt: string;
    width: number;
    height: number;
    cacheKey: string;
    className?: string;
    sizes?: string;
}

export default function CachedImage({
                                        src,
                                        alt,
                                        width,
                                        height,
                                        cacheKey,
                                        className = '',
                                        sizes = '100vw',
                                    }: CachedImageProps) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [isImageCached, setIsImageCached] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        const checkImageCache = async () => {
            if (src) {
                const cachedImageUrl = await getImageFromCache(cacheKey);
                if (cachedImageUrl) {
                    setImageLoaded(true);
                    setIsImageCached(true);
                }
            }
        };

        checkImageCache();
    }, [src, cacheKey]);

    const handleImageLoad = async () => {
        setImageLoaded(true);
        if (src && !isImageCached) {
            await saveImageToCache(cacheKey, src);
        }
    };

    if (error || !src) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <Package size={Math.min(width, height) / 2} style={{ color: theme.primary }} />
            </div>
        );
    }

    return (
        <div className="relative w-full h-full" style={{ width: `${width}px`, height: `${height}px` }}>
            <Image
                src={src}
                alt={alt}
                width={width}
                height={height}
                className={`object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
                sizes={sizes}
                loader={cloudinaryImageLoader}
                onLoad={handleImageLoad}
                onError={() => {
                    console.error(`Failed to load image: ${src}`);
                    setError(true);
                }}
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+F9PQAI/wNPbSk7hQAAAABJRU5ErkJggg=="
            />
            {!imageLoaded && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse" />
            )}
        </div>
    );
}