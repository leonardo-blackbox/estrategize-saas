import { motion } from 'framer-motion';
import { staggerItem } from '../../../../lib/motion.ts';

function getVideoEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  if (url.includes('embed') || url.includes('player')) return url;
  return null;
}

interface Props {
  title: string;
  videoUrl?: string;
}

export function LessonVideo({ title, videoUrl }: Props) {
  const embedUrl = getVideoEmbedUrl(videoUrl);

  return (
    <motion.div variants={staggerItem}>
      <div className="relative rounded-[20px] overflow-hidden bg-black border border-[var(--color-border-subtle)] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        {embedUrl ? (
          <div className="aspect-video">
            <iframe
              src={embedUrl}
              title={title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="aspect-video flex items-center justify-center bg-[var(--color-bg-elevated)]">
            <div className="text-center">
              <svg className="h-12 w-12 text-[var(--color-text-tertiary)] mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z" />
              </svg>
              <p className="text-[14px] text-[var(--color-text-tertiary)]">Video nao disponivel</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
