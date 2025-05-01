'use client';
import { useState, useEffect } from 'react';
import { theme } from "@/lib/colorPattern";
import { ProductType } from '@/lib/types/productType';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Eye, Package } from 'lucide-react';
import { formatDistance } from 'date-fns';
import Image from "next/image";
import { cloudinaryImageLoader, getImageFromCache, saveImageToCache } from '@/lib/cache/imageCache';

interface ProductDetailsProps {
    product: ProductType;
}

export default function ProductDetails({ product }: ProductDetailsProps) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [isImageCached, setIsImageCached] = useState(false);
    const createdDate = product.createdAt?.toDate ? product.createdAt.toDate() : new Date();
    const cacheKey = `product_img_${product.productId}`;

    useEffect(() => {
        const checkImageCache = async () => {
            if (product.productImgUrl) {
                const cachedImageUrl = await getImageFromCache(cacheKey);
                if (cachedImageUrl) {
                    setImageLoaded(true);
                    setIsImageCached(true);
                }
            }
        };

        checkImageCache();
    }, [product.productImgUrl, cacheKey]);

    const handleImageLoad = async () => {
        setImageLoaded(true);

        if (product.productImgUrl && !isImageCached) {
            await saveImageToCache(cacheKey, product.productImgUrl);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    style={{
                        borderColor: theme.accent,
                        color: theme.text,
                    }}
                >
                    <Eye size={14} />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle style={{ color: theme.text }}>Product Details</DialogTitle>
                    <DialogDescription>
                        View the details of the {product.productName} product, including price, stock, and description.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                    <div className="flex items-center justify-center relative">
                        {product.productImgUrl ? (
                            <div className="rounded-md overflow-hidden w-full h-48 relative">
                                <Image
                                    src={product.productImgUrl}
                                    alt={product.productName}
                                    fill
                                    className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                                    sizes="(max-width: 640px) 100vw, 500px"
                                    priority={false}
                                    loader={cloudinaryImageLoader}
                                    onLoad={handleImageLoad}
                                    onError={() => console.error(`Failed to load image: ${product.productImgUrl}`)}
                                />
                                {!imageLoaded && (
                                    <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                                )}
                            </div>
                        ) : (
                            <div className="w-full h-48 bg-gray-100 rounded-md flex items-center justify-center">
                                <Package size={64} style={{ color: theme.primary }} />
                            </div>
                        )}
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold" style={{ color: theme.text }}>{product.productName}</h2>
                        <span
                            className="px-2 py-1 rounded-full text-xs inline-block mt-1"
                            style={{
                                backgroundColor: theme.secondary,
                                color: theme.text,
                            }}
                        >
                            {product.categoryName}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Price</p>
                            <p className="text-lg font-semibold" style={{ color: theme.primary }}>${product.price.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Stock</p>
                            <p className={`text-lg font-semibold ${product.stock < 10 ? 'text-red-600' : 'text-green-600'}`}>
                                {product.stock} units
                            </p>
                        </div>
                    </div>

                    {product.description && (
                        <div>
                            <p className="text-sm text-gray-500">Description</p>
                            <p className="mt-1" style={{ color: theme.text }}>{product.description}</p>
                        </div>
                    )}

                    <div className="text-sm text-gray-500 pt-2 border-t" style={{ borderColor: theme.secondary }}>
                        Created {formatDistance(createdDate, new Date(), { addSuffix: true })}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}