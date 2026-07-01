import {
  CheckCircleIcon,
  LightningIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative flex h-200 w-full items-center justify-center bg-background dark:bg-background max-h-dvh">
      <div
        className={cn(
          "absolute inset-0",
          "bg-size-[40px_40px]",
          "bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]",
          "dark:bg-[linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]"
        )}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white mask-[radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-background"></div>
      {/* Create a two type layout here with a left and right side */}
      <div className="flex z-20 items-center justify-between w-full h-full px-4 sm:px-6 md:px-8 max-container gap-12">
        {/* Left */}
        <div className="flex flex-1 flex-col items-start justify-center">
          {/* Text container */}
          <div className="flex items-start gap-3 flex-col">
            <h3 className="font-mono text-sm">DevBoard: Project Management</h3>
            <h1 className="text-4xl font-bold">
              Organize teams. <br /> Deliver products.
            </h1>
            <p className="text-base text-muted-foreground max-w-96">
              Join teams across design, engineering, and product to build
              market-ready products with centralized task management and
              real-time collaboration.
            </p>
            {/* Buttons */}
            <div className="flex flex-wrap gap-3 pt-4">
              <Button
                variant="outline"
                className="border-border hover:border-devboard-primary hover:bg-devboard-primary/5 text-foreground h-11"
              >
                <UsersThreeIcon className="size-4" /> Team Collaboration
              </Button>
              <Button
                variant="outline"
                className="border-border hover:border-devboard-primary hover:bg-devboard-primary/5 text-foreground h-11"
              >
                <CheckCircleIcon className="size-4" /> Task Management
              </Button>
              <Button
                variant="outline"
                className="border-border hover:border-devboard-primary hover:bg-devboard-primary/5 text-foreground h-11"
              >
                <LightningIcon className="size-4" /> Real-time Updates
              </Button>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex flex-1 flex-col items-start justify-center">
          {children}
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 z-20">
        <div className="max-container pb-4">
          <p className="text-sm font-mono text-muted-foreground text-center">
            &copy; {new Date().getFullYear()} DevBoard Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
