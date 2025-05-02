import { Trash2, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { theme } from '@/lib/colorPattern';

interface ServiceCardProps {
    service: {
        serviceId: string;
        serviceName: string;
        description: string;
        price: number;
        displayPrice: number;
    };
    removeService: (serviceId: string) => void;
    currencySymbol: string;
}

export function ServiceEntryCard({ service, removeService, currencySymbol }: ServiceCardProps) {
    return (
        <Card className="overflow-hidden transition-shadow hover:shadow-md">
            <CardContent className="p-4">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <div className="flex items-center">
                            <FileText size={18} className="mr-2" style={{ color: theme.primary }} />
                            <h3 className="font-medium text-lg" style={{ color: theme.primary }}>
                                {service.serviceName}
                            </h3>
                        </div>
                        {service.description && (
                            <p className="mt-2 text-sm" style={{ color: theme.text }}>
                                {service.description}
                            </p>
                        )}
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="font-semibold" style={{ color: theme.primary }}>
                            {currencySymbol}{service.displayPrice.toFixed(2)}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeService(service.serviceId)}
                            className="mt-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                            <Trash2 size={16} className="mr-1" />
                            Remove
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}