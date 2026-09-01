"use client";

import { BuildingsIcon, CaretDownIcon } from "@phosphor-icons/react/dist/ssr";
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
import { useOrg } from "@/context/org-context";

export function OrgSwitcher() {
  const { organizations, organization, switchOrganization } = useOrg();

  if (organizations.length === 0 || !organization) {
    return null;
  }

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
        <span className="max-w-40 truncate text-xs">{organization.name}</span>
        <CaretDownIcon className="size-3 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Organizations</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={organization.id}
            onValueChange={(value) => switchOrganization(value as string)}
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
