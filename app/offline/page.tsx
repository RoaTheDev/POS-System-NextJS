import Link from 'next/link';

export default function Offline() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
            <div className="text-center max-w-md">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">You're offline</h1>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    {" It seems you've lost your internet connection. Please check your connection and try again."}
                </p>
                <Link href="/"
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                    Try again
                </Link>
            </div>
        </div>
    );
}