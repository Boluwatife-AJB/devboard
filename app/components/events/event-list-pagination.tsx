"use client";

import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EventListPaginationProps = {
  pageIndex: number;
  pageCount: number;
  rangeStart: number;
  rangeEnd: number;
  total: number;
  onPageChange: (pageIndex: number) => void;
};

export function EventListPagination({
  pageIndex,
  pageCount,
  rangeStart,
  rangeEnd,
  total,
  onPageChange,
}: EventListPaginationProps) {
  if (total === 0 || pageCount <= 1) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
      <p className="text-xs text-muted-foreground">
        Showing {rangeStart} to {rangeEnd} of {total} events
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="rounded-xs"
          aria-label="Previous page"
          onClick={() => onPageChange(pageIndex - 1)}
          disabled={pageIndex <= 0}
        >
          <CaretLeftIcon className="size-3.5" />
        </Button>
        {Array.from({ length: pageCount }, (_, index) => (
          <Button
            key={`event-page-${index + 1}`}
            type="button"
            variant={pageIndex === index ? "default" : "outline"}
            size="icon-sm"
            className={cn(
              "rounded-xs text-xs",
              pageIndex !== index && "text-muted-foreground",
            )}
            onClick={() => onPageChange(index)}
          >
            {index + 1}
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="rounded-xs"
          aria-label="Next page"
          onClick={() => onPageChange(pageIndex + 1)}
          disabled={pageIndex >= pageCount - 1}
        >
          <CaretRightIcon className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
