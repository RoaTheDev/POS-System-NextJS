'use client';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Button} from '@/components/ui/button';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import {theme} from '@/lib/colorPattern';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChangeAction: (page: number) => void;
    onItemsPerPageChangeAction: (value: string) => void;
    itemName: string;
}

export default function Pagination({
                                       currentPage,
                                       totalPages,
                                       totalItems,
                                       itemsPerPage,
                                       onPageChangeAction,
                                       onItemsPerPageChangeAction,
                                       itemName,
                                   }: PaginationProps) {
    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChangeAction(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChangeAction(currentPage + 1);
        }
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 p-6">
            <div className="flex items-center gap-3">
                <Button
                    onClick={handlePrevious}
                    disabled={currentPage === 1}
                    size="lg"
                    variant="outline"
                    style={{
                        borderColor: theme.accent,
                        color: theme.primary,
                        backgroundColor: theme.light,
                        opacity: currentPage === 1 ? 0.5 : 1,
                    }}
                >
                    <ChevronLeft size={20}/>
                </Button>

                <div className="text-sm" style={{color: theme.text}}>
                    Page {currentPage} of {totalPages} ({totalItems} {itemName})
                </div>

                <Button
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                    size="lg"
                    variant="outline"
                    style={{
                        borderColor: theme.accent,
                        color: theme.primary,
                        backgroundColor: theme.light,
                        opacity: currentPage === totalPages ? 0.5 : 1,
                    }}
                >
                    <ChevronRight size={20}/>
                </Button>
            </div>

            <div className="flex items-center gap-2">
        <span style={{color: theme.text}} className="text-sm">
          Items per page:
        </span>
                <Select
                    value={itemsPerPage.toString()}
                    onValueChange={onItemsPerPageChangeAction}
                >
                    <SelectTrigger
                        className="w-24"
                        style={{borderColor: theme.accent, color: theme.text}}
                    >
                        <SelectValue/>
                    </SelectTrigger>
                    <SelectContent>
                        {[5, 10, 25, 50].map((value) => (
                            <SelectItem key={value} value={value.toString()}>
                                {value}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}