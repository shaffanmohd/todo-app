import {Button} from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {SetStateAction} from "react";

type PaginationProps = {
  limit: number;
  page: number;
  totalPages: number;
  setLimit: (value: SetStateAction<number>) => void;
  setPage: (value: SetStateAction<number>) => void;
};
export default function Pagination({
  limit,
  page,
  totalPages,
  setLimit,
  setPage,
}: PaginationProps) {
  return (
    <>
      <Select
        value={String(limit)}
        onValueChange={(v: string | null) => {
          if (v) {
            setLimit(Number(v));
            setPage(1);
          }
        }}
      >
        <SelectTrigger className="w-36 rounded-full">
          <span>Showing {limit}</span>
        </SelectTrigger>
        <SelectContent>
          {[10, 25, 50, 100].map((n) => (
            <SelectItem key={n} value={String(n)}>
              {n} / page
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex gap-2 items-center">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground px-2">
          Page {page} of {totalPages || 1}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </>
  );
}
