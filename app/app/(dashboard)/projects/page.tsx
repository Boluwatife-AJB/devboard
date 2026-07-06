"use client";

import {
  ClockIcon,
  CodeIcon,
  FunnelIcon,
  MegaphoneIcon,
  PaletteIcon,
  PlusIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { projectCards } from "@/constant";
import { cn } from "@/lib/utils";

export default function Projects() {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <h2 className="text-3xl text-white font-semibold font-heading">
            Project Portfolio
          </h2>
          <p className="text-sm text-white">
            Taking 12 active initiatives across 3 departments.
          </p>
        </div>
        <div className="space-x-4">
          <Button
            variant="outline"
            className="h-11 px-4 rounded-xs border-devboard-primary! text-white"
          >
            <FunnelIcon className="w-5 h-5" />
            Filters
          </Button>
          <Button className="h-11 px-4 rounded-xs">
            <PlusIcon className="w-5 h-5" />
            Create Project
          </Button>
        </div>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projectCards.map((project) => (
          <Card
            key={project.title}
            className="rounded-xs py-8!"
            onClick={() => router.push(`/projects/${project.id}`)}
          >
            <CardHeader className="mx-6 px-0! h-20">
              <CardTitle className="flex items-start justify-between ">
                <div className="items-center flex gap-3">
                  <div className="flex items-center gap-2">
                    {project.scope === "design" && (
                      <div className="flex items-center justify-center w-10 h-10 rounded-xs bg-[#DF74124D]">
                        <PaletteIcon className="size-7.5 text-[#FFB786]" />
                      </div>
                    )}
                    {project.scope === "engineering" && (
                      <div className="flex items-center justify-center w-10 h-10 rounded-xs bg-[#4D8EFF4D]">
                        <CodeIcon className="size-7.5 text-[#ADC6FF]" />
                      </div>
                    )}
                    {project.scope === "marketing" && (
                      <div className="flex items-center justify-center w-10 h-10 rounded-xs bg-[#EC6A064D]">
                        <MegaphoneIcon className="w-5 h-5 text-[#FFB690]" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <span
                      className={cn(
                        "uppercase text-xs",
                        project.scope === "design" && "text-[#DF7412]",
                        project.scope === "engineering" && "text-[#4D8EFF]",
                        project.scope === "marketing" && "text-[#EC6A06]",
                      )}
                    >
                      {project.scope}
                    </span>
                    <h3 className="text-lg font-semibold">{project.title}</h3>
                  </div>
                </div>
                <Badge
                  className={cn(
                    project.status === "active" &&
                      "border-[#22C55E33] bg-[#22C55E1A] text-[#22C55E]",
                    project.status === "review" &&
                      "border-[#F59E0B33] bg-[#F59E0B1A] text-[#F59E0B]",
                    project.status === "planning" &&
                      "bg-[#ADC6FF1A]  text-[#ADC6FF] border-[#ADC6FF33]",
                    "uppercase text-xs",
                  )}
                >
                  {project.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="mx-6 px-0">
              <p className="text-base">{project.description}</p>
            </CardContent>

            <CardFooter className="mx-6 flex items-center justify-between px-0">
              <AvatarGroup>
                {project.teamMembers.slice(0, 3).map((member) => (
                  <Avatar className="size-8" key={member.name}>
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                ))}
                {project.teamMembers.length > 3 && (
                  <AvatarGroupCount>
                    +{project.teamMembers.length - 3}
                  </AvatarGroupCount>
                )}
              </AvatarGroup>
              <p className="flex items-center gap-2">
                <ClockIcon className="size-5" />
                <span className="text-sm">{project.timeRemaining}</span>
              </p>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
