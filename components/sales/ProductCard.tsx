'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Package } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { theme } from '@/lib/colorPattern';
import { ProductType } from '@/lib/types/productType';
import { cloudinaryImageLoader, getImageFromCache, saveImageToCache } from '@/lib/cache/imageCache';

interface ProductCardProps {
    product: ProductType & { displayPrice?: number };
    addToCartAction: (product: ProductType, quantity: number) => void;
    currencySymbol?: string;
    cart: number;
}

export default function ProductCard({ product, addToCartAction, currencySymbol = '$', cart }: ProductCardProps) {
    const [quantity, setQuantity] = useState(1);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [isImageCached, setIsImageCached] = useState(false);

    const priceToDisplay = product.displayPrice !== undefined ? product.displayPrice : product.price;
    const cacheKey = `product_img_${product.productId}`;
    const isOutOfStock = product.stock <= cart;

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

    const handleIncrement = () => {
        if (quantity < product.stock) {
            setQuantity(quantity + 1);
        }
    };

    const handleDecrement = () => {
        if (quantity > 1) {
            setQuantity(quantity - 1);
        }
    };

    return (
        <Card className="flex flex-col h-full overflow-hidden p-0 transition-all hover:shadow-md">
            <div className="relative w-full h-40">
                {product.productImgUrl ? (
                    <Image
                        src={product.productImgUrl}
                        alt={product.productName}
                        fill
                        className={`object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 25vw"
                        priority={false}
                        loader={cloudinaryImageLoader}
                        onLoad={handleImageLoad}
                        onError={() => console.error(`Failed to load image: ${product.productImgUrl}`)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <Package size={36} className="text-gray-500" />
                    </div>
                )}

                {product.productImgUrl && !imageLoaded && (
                    <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                )}

                <div className="absolute top-2 left-2">
                    <Badge
                        variant="outline"
                        className="text-xs font-medium whitespace-nowrap overflow-hidden max-w-full text-ellipsis"
                        style={{ backgroundColor: theme.secondary, color: theme.text }}
                    >
                        {product.categoryName}
                    </Badge>
                </div>

                {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Badge
                            className="text-sm font-medium bg-red-500 text-white"
                        >
                            Out of Stock
                        </Badge>
                    </div>
                )}
            </div>

            <CardContent className="p-2 flex flex-col justify-between gap-1 flex-grow">
                <div>
                    <div className="flex justify-between items-start">
                        <h3 className="text-xs sm:text-sm font-medium line-clamp-2 w-3/4" style={{ color: theme.text }}>
                            {product.productName}
                        </h3>
                        <p className="text-sm sm:text-base font-bold" style={{ color: theme.primary }}>
                            {currencySymbol}{priceToDisplay.toFixed(2)}
                        </p>
                    </div>

                    <p className="text-xs text-gray-600 mt-1">
                        In stock: {product.stock - cart}
                    </p>
                </div>

                <div className="flex items-center gap-1 mt-1 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center border rounded-md h-7">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-6 rounded-l-md border-r p-0"
                            onClick={handleDecrement}
                            disabled={quantity <= 1 || isOutOfStock}
                        >
                            <Minus size={12} />
                        </Button>
                        <Input
                            type="number"
                            min="1"
                            max={product.stock}
                            value={quantity}
                            onChange={(e) => setQuantity(Math.min(Math.max(1, Number(e.target.value || 1)), product.stock))}
                            className="w-7 text-center border-0 focus-visible:ring-0 no-spinner p-0 text-xs h-7"
                            disabled={isOutOfStock}
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-6 rounded-r-md border-l p-0"
                            onClick={handleIncrement}
                            disabled={quantity >= product.stock || isOutOfStock}
                        >
                            <Plus size={12} />
                        </Button>
                    </div>

                    <Button
                        className="flex-1 h-7 text-xs font-medium whitespace-nowrap"
                        style={{ backgroundColor: isOutOfStock ? 'gray' : theme.primary }}
                        onClick={() => {
                            if (quantity <= product.stock && !isOutOfStock) {
                                addToCartAction(product, quantity);
                                toast.success(`${quantity} x ${product.productName}`, {
                                    description: 'Added to cart',
                                });
                            } else if (isOutOfStock) {
                                toast.error('Item is out of stock');
                            } else {
                                toast.error('Quantity exceeds available stock');
                            }
                        }}
                        disabled={isOutOfStock}
                    >
                        <Plus size={12} className="mr-1 flex-shrink-0"/> Add
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}