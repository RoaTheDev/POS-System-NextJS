'use client';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Package } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { theme } from '@/lib/colorPattern';
import { ProductType } from '@/lib/types/productType';

interface ProductCardProps {
    product: ProductType & { displayPrice?: number };
    addToCartAction: (product: ProductType, quantity: number) => void;
    currencySymbol?: string;
}

export default function ProductCard({ product, addToCartAction, currencySymbol = '$' }: ProductCardProps) {
    const [quantity, setQuantity] = useState(1);

    const priceToDisplay = product.displayPrice !== undefined ? product.displayPrice : product.price;

    return (
        <Card className="flex flex-col h-full">
            <div className="relative w-full h-48 bg-gray-100">
                {product.productImgUrl ? (
                    <Image
                        src={product.productImgUrl}
                        alt={product.productName}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 300px"
                        priority={false}
                        onError={() => console.error(`Failed to load image: ${product.productImgUrl}`)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <Package size={40} className="text-gray-500" />
                    </div>
                )}
            </div>
            <CardHeader className="pb-2">
                <CardTitle className="text-base truncate" style={{ color: theme.text }}>
                    {product.productName}
                </CardTitle>
                <CardDescription>
                    <Badge
                        variant="outline"
                        style={{ backgroundColor: theme.secondary, color: theme.text }}
                    >
                        {product.categoryName}
                    </Badge>
                </CardDescription>
            </CardHeader>
            <CardContent className="pb-2 flex-grow">
                <p className="text-lg font-bold" style={{ color: theme.primary }}>
                    {currencySymbol}{priceToDisplay.toFixed(2)}
                </p>
                <p className="text-sm mt-1" style={{ color: theme.text }}>
                    In stock: {product.stock}
                </p>
            </CardContent>
            <CardFooter>
                <div className="flex space-x-2 w-full">
                    <Input
                        type="number"
                        min="1"
                        max={product.stock}
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="w-20"
                    />
                    <Button
                        className="flex-1"
                        style={{ backgroundColor: theme.primary }}
                        onClick={() => {
                            if (quantity <= product.stock) {
                                addToCartAction(product, quantity);
                                toast.success(`${quantity} x ${product.productName}`, {
                                    description: 'Added to cart',
                                });
                            } else {
                                toast.error('Quantity exceeds available stock');
                            }
                        }}
                        disabled={product.stock <= 0}
                    >
                        <Plus size={16} className="mr-1" /> Add
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}