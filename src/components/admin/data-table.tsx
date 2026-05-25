"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  Search,
  Inbox,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  /** Column header label */
  label: string;
  /** Unique key for the column (used for sorting) */
  key: string;
  /** Custom render function for the cell */
  render: (row: T) => React.ReactNode;
  /** Optional value accessor used for sorting; if absent, sorting is disabled on this column */
  sortValue?: (row: T) => string | number;
  /** Alignment of the cell content */
  align?: "left" | "right" | "center";
  /** Optional className for the <td> */
  className?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  /** Function returning the searchable string for a row (defaults to JSON.stringify) */
  searchAccessor?: (row: T) => string;
  /** Placeholder for the search input */
  searchPlaceholder?: string;
  /** Number of items per page */
  pageSize?: number;
  /** Optional extra filters slot rendered next to the search input */
  filters?: React.ReactNode;
  /** Hide the search input entirely */
  hideSearch?: boolean;
  /** Empty state title */
  emptyTitle?: string;
  /** Empty state description */
  emptyDescription?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  searchAccessor,
  searchPlaceholder = "Rechercher...",
  pageSize = 10,
  filters,
  hideSearch = false,
  emptyTitle = "Aucun résultat",
  emptyDescription = "Aucun élément ne correspond à votre recherche.",
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Filter rows by search
  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const term = search.toLowerCase();
    return rows.filter((row) => {
      const text = searchAccessor
        ? searchAccessor(row)
        : JSON.stringify(row);
      return text.toLowerCase().includes(term);
    });
  }, [rows, search, searchAccessor]);

  // Sort
  const sortedRows = useMemo(() => {
    if (!sortKey) return filteredRows;
    const column = columns.find((c) => c.key === sortKey);
    if (!column?.sortValue) return filteredRows;
    const sorted = [...filteredRows].sort((a, b) => {
      const va = column.sortValue!(a);
      const vb = column.sortValue!(b);
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredRows, sortKey, sortDir, columns]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = sortedRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      {(!hideSearch || filters) && (
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {!hideSearch && (
            <div className="relative md:max-w-sm md:flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
          )}
          {filters && (
            <div className="flex flex-wrap items-center gap-2">{filters}</div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {sortedRows.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={emptyTitle}
            description={emptyDescription}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {columns.map((col) => {
                    const isSorted = sortKey === col.key;
                    const canSort = !!col.sortValue;
                    return (
                      <th
                        key={col.key}
                        className={cn(
                          "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                          col.align === "right" && "text-right",
                          col.align === "center" && "text-center"
                        )}
                      >
                        {canSort ? (
                          <button
                            type="button"
                            onClick={() => handleSort(col.key)}
                            className={cn(
                              "inline-flex items-center gap-1 hover:text-foreground",
                              col.align === "right" && "ml-auto"
                            )}
                          >
                            {col.label}
                            {isSorted ? (
                              sortDir === "asc" ? (
                                <ChevronUp className="size-3.5" />
                              ) : (
                                <ChevronDown className="size-3.5" />
                              )
                            ) : (
                              <ChevronsUpDown className="size-3.5 opacity-50" />
                            )}
                          </button>
                        ) : (
                          col.label
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-border last:border-b-0 hover:bg-muted/30"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-4 py-3 align-middle text-foreground",
                          col.align === "right" && "text-right",
                          col.align === "center" && "text-center",
                          col.className
                        )}
                      >
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {sortedRows.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              {(currentPage - 1) * pageSize + 1}-
              {Math.min(currentPage * pageSize, sortedRows.length)} sur{" "}
              {sortedRows.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="size-4" />
                Précédent
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Suivant
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
