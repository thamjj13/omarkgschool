import { mediaUrl } from "@/lib/media-url";
import { cn } from "@/lib/utils";

export function MediaImg({
  id,
  alt = "",
  className,
  thumb = false,
  width,
  height,
  eager = false,
}: {
  id: number | null | undefined;
  alt?: string;
  className?: string;
  thumb?: boolean;
  width?: number;
  height?: number;
  eager?: boolean;
}) {
  if (!id) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${mediaUrl(id)}${thumb ? "?thumb=1" : ""}`}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding={eager ? "sync" : "async"}
      width={width}
      height={height}
      className={cn("object-cover", className)}
    />
  );
}
