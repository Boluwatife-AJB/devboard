import { ArrowSquareOutIcon } from "@phosphor-icons/react/dist/ssr";
import type { ApiMessageEmbed } from "@/types";

export function EmbedCard({ embed }: { embed: ApiMessageEmbed }) {
  return (
    <a
      href={embed.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xs border border-[#2A2A2A] bg-[#0B0E14] p-3 transition-colors hover:border-[#4A4A4A]"
    >
      <div className="flex items-center gap-2 text-xs text-[#C2C6D6]">
        <ArrowSquareOutIcon className="size-4" />
        <span className="truncate">
          {embed.siteName ?? embed.repo ?? embed.kind.toLowerCase()}
        </span>
      </div>
      <p className="mt-2 truncate text-sm text-white">
        {embed.title ?? embed.url}
      </p>
      {embed.description && (
        <p className="mt-1 line-clamp-2 text-xs text-[#8A8A8A]">
          {embed.description}
        </p>
      )}
    </a>
  );
}
