"use client";

import {
  CaretLeftIcon,
  CaretRightIcon,
  CheckIcon,
  DownloadSimpleIcon,
  FunnelSimpleIcon,
  MagnifyingGlassIcon,
} from "@phosphor-icons/react/dist/ssr";
import {
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  canManageInvitations,
  usePendingInvitations,
} from "@/hooks/use-invitations";
import { useMe } from "@/hooks/use-me";
import { usePresenceEvents } from "@/hooks/use-messaging-events";
import { useOrgMembers } from "@/hooks/use-teams";
import { toUiPresence } from "@/lib/message-utils";
import { cn } from "@/lib/utils";
import type { OrgRole, UiPresence } from "@/types";
import { type MemberRow, membersColumns, roleLabels } from "./members-columns";

const PAGE_SIZE = 8;

const roleFilterOptions: Array<{ label: string; value: OrgRole | null }> = [
  { label: "All roles", value: null },
  { label: "Owner", value: "ORG_OWNER" },
  { label: "Admin", value: "ORG_ADMIN" },
  { label: "Member", value: "ORG_MEMBER" },
];

function exportCsv(rows: MemberRow[]) {
  const header = "Name,Email,Role,Status";
  const escapeCell = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const lines = rows.map((row) =>
    [row.name, row.email, roleLabels[row.role], row.status]
      .map(escapeCell)
      .join(","),
  );
  const blob = new Blob([[header, ...lines].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "members.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function MembersTable() {
  const { data: members, isPending, isError } = useOrgMembers();
  const { data: me } = useMe();
  // Resolve after mount — canManageInvitations reads cookies/localStorage,
  // which aren't available during SSR, so a useState initializer would stick at false.
  const [canManage, setCanManage] = useState(false);
  useEffect(() => {
    setCanManage(canManageInvitations());
  }, []);
  const { data: invitations } = usePendingInvitations(canManage);

  const [presenceMap, setPresenceMap] = useState<Record<string, UiPresence>>(
    {},
  );
  usePresenceEvents(
    useCallback((presence) => {
      setPresenceMap((prev) => ({
        ...prev,
        [presence.userId]: toUiPresence(presence.status),
      }));
    }, []),
  );

  const rows = useMemo<MemberRow[]>(() => {
    const memberRows: MemberRow[] = (members ?? []).map((member) => ({
      kind: "member",
      userId: member.userId,
      name: member.user?.displayName ?? "Unknown user",
      email: member.user?.email ?? "—",
      role: member.role,
      status:
        member.userId === me?.id
          ? "online"
          : (presenceMap[member.userId] ?? "offline"),
    }));

    const inviteRows: MemberRow[] = (invitations ?? []).map((invitation) => ({
      kind: "invite",
      userId: invitation.id,
      name: invitation.email,
      email: invitation.email,
      role: invitation.role,
      status: "pending",
      inviteUrl: invitation.inviteUrl,
    }));

    return [...memberRows, ...inviteRows];
  }, [members, me?.id, presenceMap, invitations]);

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data: rows,
    columns: membersColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnFiltersChange: setColumnFilters,
    state: { columnFilters },
    initialState: { pagination: { pageSize: PAGE_SIZE } },
  });

  const roleFilter =
    (table.getColumn("role")?.getFilterValue() as string | undefined) ?? null;

  const filteredCount = table.getFilteredRowModel().rows.length;
  const { pageIndex, pageSize } = table.getState().pagination;
  const rangeStart = filteredCount === 0 ? 0 : pageIndex * pageSize + 1;
  const rangeEnd = Math.min((pageIndex + 1) * pageSize, filteredCount);
  const pageCount = table.getPageCount();

  return (
    <div className="rounded-md border border-border bg-card">
      <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
        <div className="relative w-full max-w-xs">
          <MagnifyingGlassIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter directory..."
            className="pl-8 font-mono text-xs"
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="uppercase">
                  <FunnelSimpleIcon data-icon="inline-start" />
                  Role
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-40">
              {roleFilterOptions.map((option) => (
                <DropdownMenuItem
                  key={option.label}
                  onClick={() =>
                    table
                      .getColumn("role")
                      ?.setFilterValue(option.value ?? undefined)
                  }
                >
                  {option.label}
                  {roleFilter === option.value && (
                    <CheckIcon className="ml-auto size-3.5" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            className="uppercase"
            onClick={() =>
              exportCsv(
                table.getFilteredRowModel().rows.map((row) => row.original),
              )
            }
          >
            <DownloadSimpleIcon data-icon="inline-start" />
            Export
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="px-4 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isPending ? (
            Array.from({ length: 4 }).map((_, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
              <TableRow key={index}>
                <TableCell className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-9 rounded-xs" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-3 w-44" />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-4">
                  <Skeleton className="h-6 w-16" />
                </TableCell>
                <TableCell className="px-4">
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell className="px-4">
                  <Skeleton className="ml-auto size-7" />
                </TableCell>
              </TableRow>
            ))
          ) : isError ? (
            <TableRow>
              <TableCell
                colSpan={membersColumns.length}
                className="h-24 text-center text-destructive"
              >
                Failed to load members. Please try again.
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={membersColumns.length}
                className="h-24 text-center text-muted-foreground"
              >
                No members found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4">
        <p className="text-xs text-muted-foreground">
          Showing {rangeStart} to {rangeEnd} of {filteredCount} members
        </p>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous page"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <CaretLeftIcon className="size-3.5" />
          </Button>
          {Array.from({ length: pageCount }, (_, index) => (
            <Button
              key={`page-${index + 1}`}
              variant={pageIndex === index ? "default" : "outline"}
              size="icon-sm"
              className={cn(
                "text-xs",
                pageIndex !== index && "text-muted-foreground",
              )}
              onClick={() => table.setPageIndex(index)}
            >
              {index + 1}
            </Button>
          ))}
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next page"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <CaretRightIcon className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
