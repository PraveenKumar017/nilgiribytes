type BlogVideoProps = {
  src: string;
  caption?: string;
};

function youtubeEmbedUrl(src: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
    /youtube(?:-nocookie)?\.com\/embed\/([\w-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = src.match(pattern);
    if (match) {
      return `https://www.youtube-nocookie.com/embed/${match[1]}`;
    }
  }

  return null;
}

function vimeoEmbedUrl(src: string): string | null {
  const match = src.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? `https://player.vimeo.com/video/${match[1]}` : null;
}

function isDirectVideo(src: string): boolean {
  return /\.(mp4|webm|ogg|ogv|mov)(\?.*)?$/i.test(src);
}

export function BlogVideo({ src, caption }: BlogVideoProps) {
  if (!src) return null;

  const direct = isDirectVideo(src);
  const embed = direct ? null : youtubeEmbedUrl(src) ?? vimeoEmbedUrl(src);

  return (
    <figure className="article_video">
      {direct ? (
        <video src={src} controls preload="metadata" playsInline>
          Your browser does not support the video tag.
        </video>
      ) : embed ? (
        <div className="article_video-frame">
          <iframe
            src={embed}
            title={caption || "Video"}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ) : (
        <a
          className="article_video-link"
          href={src}
          target="_blank"
          rel="noopener noreferrer"
        >
          Watch video
        </a>
      )}
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}
