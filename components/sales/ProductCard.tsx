'use client';
import {useEffect, useState} from 'react';
import {Card, CardContent} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Minus, Package, Plus, ShoppingCart} from 'lucide-react';
import Image from 'next/image';
import {toast} from 'sonner';
import {theme} from '@/lib/colorPattern';
import {ProductType} from '@/lib/types/productType';
import {cloudinaryImageLoader, getImageFromCache, saveImageToCache} from '@/lib/cache/imageCache';

interface ProductCardProps {
    product: ProductType & { displayPrice?: number };
    addToCartAction: (product: ProductType, quantity: number) => void;
    currencySymbol?: string;
    cart: number;
}
const renderDescription = (text: string) => {
    const segments = text.split(/([\u1780-\u17FF]+)/).filter(Boolean);
    return segments.map((segment, index) =>
        /[\u1780-\u17FF]/.test(segment) ? (
            <span key={index} className="font-khmer">{segment}</span>
        ) : (
            <span key={index} className="font-english">{segment}</span>
        )
    );
};

export default function ProductCard({product, addToCartAction, currencySymbol = '$', cart}: ProductCardProps) {
    const [quantity, setQuantity] = useState(1);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [isImageCached, setIsImageCached] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const priceToDisplay = product.displayPrice !== undefined ? product.displayPrice : product.price;
    const cacheKey = `product_img_${product.productId}`;
    const isOutOfStock = product.stock <= cart;
    const availableStock = product.stock - cart;

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

    const addToCart = () => {
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
    };

    return (
        <Card
            className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-md min-w-[180px] max-w-[280px] mx-auto rounded-md border-gray-200"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: isHovered ? '0 6px 12px -2px rgba(0, 0, 0, 0.1)' : ''
            }}
        >
            <div className="relative w-full h-40 overflow-hidden -mt-6">
                {product.productImgUrl ? (
                    <Image
                        src={product.productImgUrl}
                        alt={product.productName}
                        fill
                        className={`object-cover transition-all duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'} ${isHovered ? 'scale-105' : 'scale-100'}`}
                        sizes="(max-width: 640px) 40vw, (max-width: 1024px) 22vw, 18vw"
                        priority={false}
                        loader={cloudinaryImageLoader}
                        onLoad={handleImageLoad}
                        onError={() => console.error(`Failed to load image: ${product.productImgUrl}`)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <Package size={32} className="text-gray-400"/>
                    </div>
                )}

                {product.productImgUrl && !imageLoaded && (
                    <div className="absolute inset-0 bg-gray-200 animate-pulse"/>
                )}

                <div className="absolute top-2 left-2">
                    <Badge
                        variant="outline"
                        className="text-xs font-medium px-1.5 py-0.5 rounded-full shadow-sm"
                        style={{
                            backgroundColor: theme.primary,
                            color: theme.light,
                            borderColor: theme.secondary,
                            opacity: 0.95
                        }}
                    >
                        {product.categoryName}
                    </Badge>
                </div>

                {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                        <Badge
                            className="text-xs font-bold px-2 py-0.5 bg-red-500 text-white shadow-sm"
                        >
                            Out of Stock
                        </Badge>
                    </div>
                )}
            </div>

            <CardContent className="p-3 flex flex-col justify-between gap-2 flex-grow">
                <div>
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="text-sm font-semibold line-clamp-2" style={{color: theme.text}}>
                            {product.productName}
                        </h3>
                        <div className="flex flex-col items-end gap-0.5">
                            <p className="text-base font-bold" style={{color: theme.primary}}>
                                {currencySymbol}{priceToDisplay.toFixed(2)}
                            </p>
                            <span className="text-xs font-medium min-h-[14px] text-right">
                                {availableStock < 5 && availableStock > 0 ? (
                                    <span className="text-amber-600">Only {availableStock} left</span>
                                ) : availableStock > 0 ? (
                                    <span className="text-gray-500">{availableStock} in stock</span>
                                ) : null}
                            </span>
                        </div>
                    </div>
                    {product.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                            {product.description && renderDescription(product.description)}
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-1.5 mt-2">
                    <div className="flex items-center gap-1.5">
                        <div className="flex items-center border rounded-md h-8 shadow-sm">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-l-md border-r p-0 hover:bg-gray-100"
                                onClick={handleDecrement}
                                disabled={quantity <= 1 || isOutOfStock}
                            >
                                <Minus size={14}/>
                            </Button>
                            <Input
                                type="number"
                                min="1"
                                max={product.stock}
                                value={quantity}
                                onChange={(e) => setQuantity(Math.min(Math.max(1, Number(e.target.value || 1)), product.stock))}
                                className="w-10 text-center border-0 focus-visible:ring-0 no-spinner p-0 text-xs h-8 font-medium"
                                disabled={isOutOfStock}
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-r-md border-l p-0 hover:bg-gray-100"
                                onClick={handleIncrement}
                                disabled={quantity >= product.stock || isOutOfStock}
                            >
                                <Plus size={14}/>
                            </Button>
                        </div>

                        <Button
                            className="flex-1 h-8 text-xs font-medium transition-all duration-300"
                            style={{
                                backgroundColor: isOutOfStock ? '#9CA3AF' : theme.primary,
                                boxShadow: isHovered && !isOutOfStock ? '0 3px 5px -1px rgba(0, 0, 0, 0.1)' : 'none'
                            }}
                            onClick={addToCart}
                            disabled={isOutOfStock}
                        >
                            <ShoppingCart size={14} className="mr-1 flex-shrink-0"/>
                            Add
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}