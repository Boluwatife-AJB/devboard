import { BellIcon, MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Input } from "../ui/input";

export default function DashboardHeader() {
  return (
    <header className="h-20 border-b border-outline bg-[#131313] flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="relative">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
        <Input
          id="text"
          className="py-6 pl-11 border border-devboard-neutral focus:outline-none focus:border-devboard-primary focus:ring-1 focus:ring-devboard-primary/20 placeholder:font-semibold transition-all duration-150 w-96 placeholder:text-sm text-sm rounded-xs"
          placeholder="Search tasks, projects, users..."
          type="text"
          autoComplete="off"
        />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-6">
        <div className="h-6 w-px bg-outline"></div>

        {/* <Button className="px-3 py-1.5 bg-devboard-primary hover:bg-devboard-primary/90 text-white rounded text-xs font-medium transition-opacity flex items-center gap-2">
          <RocketLaunchIcon className="w-5 h-5" />
          Deploy
        </Button> */}

        <BellIcon className="w-5 h-5 text-on-surface-variant cursor-pointer hover:text-on-surface transition-colors" />

        <Avatar>
          <AvatarImage
            src="https://avatars.githubusercontent.com/u/56480003?v=4"
            alt="@Boluwatife-AJB"
            className="grayscale"
          />
          <AvatarFallback>BA</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
