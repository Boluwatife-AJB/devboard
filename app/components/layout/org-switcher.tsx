"use client";

import { BuildingsIcon, CaretDownIcon } from "@phosphor-icons/react/dist/ssr";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getOrganizations,
  getSelectedOrgId,
  setSelectedOrgId,
} from "@/lib/auth/cookies";
import type { AuthOrganization } from "@/types";

export function OrgSwitcher() {
  const queryClient = useQueryClient();
  const [organizations, setOrganizations] = useState<AuthOrganization[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>();

  // Auth state lives in cookies/localStorage, so read it after mount
  useEffect(() => {
    setOrganizations(getOrganizations());
    setSelectedId(getSelectedOrgId());
  }, []);

  if (organizations.length === 0) {
    return null;
  }

  const selected =
    organizations.find((org) => org.id === selectedId) ?? organizations[0];

  const handleSelect = (orgId: string) => {
    if (orgId === selectedId) return;
    setSelectedOrgId(orgId);
    setSelectedId(orgId);
    // All fetched data is scoped to the org header, so drop the cache
    queryClient.clear();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            className="h-9 gap-2 rounded-xs border-devboard-primary/40 text-white"
          />
        }
      >
        <BuildingsIcon className="size-4" />
        <span className="max-w-40 truncate text-xs">{selected.name}</span>
        <CaretDownIcon className="size-3 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Organizations</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={selected.id}
            onValueChange={(value) => handleSelect(value as string)}
          >
            {organizations.map((org) => (
              <DropdownMenuRadioItem key={org.id} value={org.id}>
                <span className="truncate">{org.name}</span>
                <span className="ml-auto text-[10px] uppercase text-muted-foreground">
                  {org.role}
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
