import { FunnelIcon, PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";

export default function Projects() {
  return (
    <div>
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
    </div>
  );
}
