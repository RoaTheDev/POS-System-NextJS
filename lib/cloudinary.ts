import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

export { cloudinary };

export const generatePublicId = (filename: string): string => {
    const timestamp = Date.now();
    const nameWithoutExtension = filename.split('.')[0];
    return `products/${timestamp}_${nameWithoutExtension}`;
};
