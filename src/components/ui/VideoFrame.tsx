import { useState } from 'react'
import { ImagePlaceholder } from './ImagePlaceholder'

type VideoFrameProps = {
  /** Client-supplied video file. While undefined the existing placeholder is shown. */
  src?: string
  poster?: string
  title: string
}

/**
 * 16:9 video that never exceeds the viewport: width is capped so that the height fits
 * inside the dialog on short (landscape phone) screens. Shows loading and error states.
 */
export function VideoFrame({ src, poster, title }: VideoFrameProps) {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')

  return (
    <div
      className="mx-auto w-full"
      // Height budget: viewport minus dialog padding / close-button row.
      style={{ maxWidth: 'min(100%, calc((100dvh - 10rem) * 16 / 9))' }}
    >
      {src ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black sm:rounded-2xl">
          <video
            key={src}
            className="size-full object-contain"
            src={src}
            poster={poster}
            controls
            playsInline
            preload="metadata"
            aria-label={title}
            onLoadedData={() => setState('ready')}
            onError={() => setState('error')}
          />
          {state === 'loading' && (
            <div role="status" className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-white/70">
              Loading video…
            </div>
          )}
          {state === 'error' && (
            <div role="alert" className="absolute inset-0 grid place-items-center bg-espresso-900 p-6 text-center text-sm text-white/80">
              Sorry, this video could not be played right now. Please try again later.
            </div>
          )}
        </div>
      ) : (
        // FINAL VIDEO: set `fullVideo.src` in data/site.ts to the client-supplied file (16:9).
        <ImagePlaceholder
          name="full-video-placeholder"
          hint="Full company video (16:9)"
          tone="dark"
          className="aspect-video w-full rounded-xl sm:rounded-2xl"
        />
      )}
    </div>
  )
}
