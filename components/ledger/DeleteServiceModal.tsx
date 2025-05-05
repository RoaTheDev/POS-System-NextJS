'use client'

import { useState } from 'react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RefreshCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ServiceHistory } from '@/lib/types/serviceType';
import { theme } from '@/lib/colorPattern';

interface DeleteServiceModalProps {
    open: boolean;
    onCloseAction: () => void;
    service: ServiceHistory | null;
    onSuccessAction: () => void;
}

export default function DeleteServiceModal({ open, onCloseAction, service, onSuccessAction }: DeleteServiceModalProps) {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!service) return;

        try {
            setLoading(true);
            await deleteDoc(doc(db, 'services', service.id));
            onSuccessAction();
            onCloseAction();
        } catch (error) {
            console.error('Error deleting service:', error);
            toast.error('Failed to delete service');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onCloseAction}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle style={{ color: theme.primary }}>Delete Service</DialogTitle>
                    <DialogDescription>
                        This action will permanently delete the service. Are you sure you want to proceed?
                    </DialogDescription>
                </DialogHeader>
                {service && (
                    <div className="py-4">
                        <div className="p-3 rounded-md" style={{ backgroundColor: theme.light }}>
                            <p className="font-medium" style={{ color: theme.text }}>
                                {service.serviceTransactionId}
                            </p>
                            <p className="text-sm" style={{ color: theme.text }}>
                                Customer: {service.customerName}
                            </p>
                            <p className="text-sm" style={{ color: theme.text }}>
                                Service: {service.service.serviceName}
                            </p>
                            <p className="text-sm" style={{ color: theme.text }}>
                                Total: ${Number(service.totalAmount).toFixed(2)}
                            </p>
                        </div>
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={onCloseAction} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <RefreshCcw size={16} className="mr-2 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 size={16} className="mr-2" />
                                Delete Service
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}