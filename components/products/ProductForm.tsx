'use client';

import React, {useRef, useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage,} from '@/components/ui/form';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from '@/components/ui/select';
import {ProductFormData, ProductType} from '@/lib/types/productType';
import {Image as ImageIcon, Loader2} from 'lucide-react';
import {toast} from 'sonner';
import Image from 'next/image';
import {useProductStore} from '@/lib/stores/productStore';
import {CldImage} from 'next-cloudinary';

const productFormSchema = z.object({
    productName: z.string().min(2, {message: 'Product name must be at least 2 characters'}),
    description: z.string().optional(),
    categoryName: z.string().min(1, {message: 'Please select a category'}),
    price: z.coerce.number().min(0.01, {message: 'Price must be greater than 0'}),
    stock: z.coerce.number().int().min(0, {message: 'Stock cannot be negative'}),
});

type ProductFormProps = {
    onSubmitAction: (data: ProductFormData) => Promise<void>;
    initialData?: ProductType;
    isLoading?: boolean;
    categories: string[];
};

export default function ProductForm({
                                        onSubmitAction,
                                        initialData,
                                        isLoading = false,
                                        categories,
                                    }: ProductFormProps) {
    const {error} = useProductStore();
    const [imagePreview, setImagePreview] = useState<string | null>(initialData?.productImgUrl || null);
    const [imageFile, setImageFile] = useState<File | undefined>(undefined);
    const [imageUploading, setImageUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<z.infer<typeof productFormSchema>>({
        resolver: zodResolver(productFormSchema),
        defaultValues: {
            productName: initialData?.productName || '',
            categoryName: initialData?.categoryName || '',
            price: initialData?.price || 0,
            stock: initialData?.stock || 0,
            description: initialData?.description || '',
        },
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
        const maxSize = 3 * 1024 * 1024; // 3MB
        if (!validTypes.includes(file.type)) {
            toast.error('Please upload a valid image (JPEG, PNG, or GIF).');
            return;
        }
        if (file.size > maxSize) {
            toast.error('Image size must be less than 3MB.');
            return;
        }

        setImageFile(file);

        const reader = new FileReader();
        reader.onloadstart = () => setImageUploading(true);
        reader.onload = (event) => {
            setImagePreview(event.target?.result as string);
            setImageUploading(false);
        };
        reader.onerror = () => {
            toast.error('Failed to load image preview.');
            setImageUploading(false);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (values: z.infer<typeof productFormSchema>) => {
        try {
            const formData: ProductFormData = {
                ...values,
                productImage: imageFile,
            };
            await onSubmitAction(formData);
            form.reset({
                productName: '',
                categoryName: '',
                price: 0,
                stock: 0,
                description: '',
            });
            setImagePreview(null);
            setImageFile(undefined);
            toast.success(
                initialData ? 'Product updated successfully!' : 'Product added successfully!'
            );
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Failed to submit product';
            toast.error(errorMessage);
            console.error('Form submission error:', e);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {error && <div className="text-red-500 text-sm">{error.message}</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <FormField
                            control={form.control}
                            name="productName"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Product Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter product name" {...field} />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="categoryName"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a category"/>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem key={category} value={category}>
                                                    {category}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="price"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Price</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="stock"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Stock</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                    <div className="space-y-6">
                        <FormField
                            control={form.control}
                            name="description"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Enter product description"
                                            className="h-24"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <div>
                            <FormLabel>Product Image</FormLabel>
                            <div
                                className="mt-2 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer"
                                style={{borderColor: imagePreview ? 'transparent' : '#FF8FAB'}}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {imageUploading ? (
                                    <div className="flex flex-col items-center space-y-2">
                                        <Loader2 className="h-8 w-8 animate-spin text-gray-400"/>
                                        <p className="text-sm text-gray-500">Uploading...</p>
                                    </div>
                                ) : imagePreview ? (
                                    <div className="relative w-full h-32">
                                        {/* Use CldImage for Cloudinary images that are already uploaded */}
                                        {initialData?.cloudinaryPublicId && !imageFile ? (
                                            <CldImage
                                                src={initialData.cloudinaryPublicId}
                                                alt="Product preview"
                                                fill
                                                style={{objectFit: 'cover'}}
                                                className="rounded-md"
                                            />
                                        ) : (
                                            // Use regular Image for local file previews
                                            <Image
                                                src={imagePreview}
                                                alt="Product preview"
                                                fill
                                                style={{objectFit: 'cover'}}
                                                className="rounded-md"
                                            />
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center space-y-2">
                                        <ImageIcon className="h-8 w-8 text-gray-400"/>
                                        <p className="text-sm text-gray-500">Click to upload product image</p>
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    id="product-image"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageChange}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            backgroundColor: isLoading ? '#aaa' : '#FF4B6A',
                            color: 'white',
                            cursor: isLoading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {initialData ? 'Update Product' : 'Add Product'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}