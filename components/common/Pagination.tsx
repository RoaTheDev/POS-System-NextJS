'use client';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Button} from '@/components/ui/button';
import {ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight} from 'lucide-react';
import {theme} from '@/lib/colorPattern';
import {useEffect} from 'react';

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
    useEffect(() => {
        if (totalPages > 0 && currentPage > totalPages) {
            onPageChangeAction(totalPages);
        } else if (totalPages === 0 && currentPage !== 1) {
            onPageChangeAction(1);
        }
    }, [currentPage, totalPages, onPageChangeAction]);

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

    const handleFirst = () => {
        if (currentPage !== 1) {
            onPageChangeAction(1);
        }
    };

    const handleLast = () => {
        if (currentPage !== totalPages) {
            onPageChangeAction(totalPages);
        }
    };

    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    // Calculate page numbers to display (show up to 5 pages with current page in the middle when possible)
    const getPageNumbers = () => {
        const pageNumbers = [];
        const maxPagesToShow = 5;

        if (totalPages <= maxPagesToShow) {
            // If we have 5 or fewer pages, show all
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            // Calculate range with current page in the middle
            let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
            let endPage = startPage + maxPagesToShow - 1;

            // Adjust if end page exceeds total
            if (endPage > totalPages) {
                endPage = totalPages;
                startPage = Math.max(1, endPage - maxPagesToShow + 1);
            }

            for (let i = startPage; i <= endPage; i++) {
                pageNumbers.push(i);
            }
        }

        return pageNumbers;
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6">
            <div className="text-sm" style={{color: theme.text}}>
                {totalItems > 0 ? (
                    <>Showing {startItem} to {endItem} of {totalItems} {itemName}</>
                ) : (
                    <>No {itemName} found</>
                )}
            </div>

            <div className="flex items-center gap-2">
                {/* First page button (only visible on medium screens and up) */}
                <Button
                    onClick={handleFirst}
                    disabled={currentPage === 1}
                    size="icon"
                    variant="outline"
                    className="hidden md:flex"
                    style={{
                        borderColor: theme.accent,
                        color: theme.primary,
                        backgroundColor: theme.light,
                        opacity: currentPage === 1 ? 0.5 : 1,
                    }}
                >
                    <ChevronsLeft size={16}/>
                </Button>

                {/* Previous page button */}
                <Button
                    onClick={handlePrevious}
                    disabled={currentPage === 1}
                    size="icon"
                    variant="outline"
                    style={{
                        borderColor: theme.accent,
                        color: theme.primary,
                        backgroundColor: theme.light,
                        opacity: currentPage === 1 ? 0.5 : 1,
                    }}
                >
                    <ChevronLeft size={16}/>
                </Button>

                {/* Page numbers (only visible on medium screens and up) */}
                <div className="hidden md:flex gap-1">
                    {getPageNumbers().map(pageNum => (
                        <Button
                            key={pageNum}
                            onClick={() => onPageChangeAction(pageNum)}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            style={{
                                borderColor: theme.accent,
                                color: currentPage === pageNum ? "white" : theme.primary,
                                backgroundColor: currentPage === pageNum ? theme.primary : theme.light,
                                minWidth: "2rem"
                            }}
                        >
                            {pageNum}
                        </Button>
                    ))}
                </div>

                {/* Mobile page indicator */}
                <div className="md:hidden text-sm px-2" style={{color: theme.text}}>
                    Page {currentPage} of {totalPages || 1}
                </div>

                {/* Next page button */}
                <Button
                    onClick={handleNext}
                    disabled={currentPage === totalPages || totalPages === 0}
                    size="icon"
                    variant="outline"
                    style={{
                        borderColor: theme.accent,
                        color: theme.primary,
                        backgroundColor: theme.light,
                        opacity: currentPage === totalPages || totalPages === 0 ? 0.5 : 1,
                    }}
                >
                    <ChevronRight size={16}/>
                </Button>

                {/* Last page button (only visible on medium screens and up) */}
                <Button
                    onClick={handleLast}
                    disabled={currentPage === totalPages || totalPages === 0}
                    size="icon"
                    variant="outline"
                    className="hidden md:flex"
                    style={{
                        borderColor: theme.accent,
                        color: theme.primary,
                        backgroundColor: theme.light,
                        opacity: currentPage === totalPages || totalPages === 0 ? 0.5 : 1,
                    }}
                >
                    <ChevronsRight size={16}/>
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <span style={{color: theme.text}} className="text-sm">
                    Items per page:
                </span>
                <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                        onItemsPerPageChangeAction(value);
                        // Reset to first page when changing items per page
                        onPageChangeAction(1);
                    }}
                >
                    <SelectTrigger
                        className="w-24"
                        style={{borderColor: theme.accent, color: theme.text}}
                    >
                        <SelectValue/>
                    </SelectTrigger>
                    <SelectContent>
                        {[5, 10, 15].map((value) => (
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