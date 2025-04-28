import { NextResponse } from 'next/server';
import { cloudinary } from '@/lib/cloudinary';

export async function POST(request: Request) {
    try {
        const { publicId } = await request.json();

        if (!publicId) {
            return NextResponse.json({ error: 'Missing public ID' }, { status: 400 });
        }

        const result = await cloudinary.uploader.destroy(publicId);

        if (result.result !== 'ok') {
            return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
