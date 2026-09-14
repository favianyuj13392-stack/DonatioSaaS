import React, { useState } from 'react';
import type { TestimonialItem } from '../types';
import { hasText, safeLink } from './Editorial';

interface Props {
  storyMarkdown?: string | null;
  storyImageUrl?: string | null;
  locationCity?: string | null;
  testimonial?: TestimonialItem | null;
}
function inlineMarkdown(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|\[[^\]]+\]\([^)]+\))/g)
    .map((part, index) => {
      if (/^(\*\*|__)/.test(part)) return <strong key={index}>{part.slice(2, -2)}</strong>;
      if (/^(\*|_)/.test(part)) return <em key={index}>{part.slice(1, -1)}</em>;
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
      if (link) {
        const href = safeLink(link[2], '');
        return href ? <a key={index} href={href}>{link[1]}</a> : <React.Fragment key={index}>{link[1]}</React.Fragment>;
      }
      return part;
    });
}
function StoryText({ text }: { text: string }) {
  return <div className="journal-story__prose">{text.trim().split(/\n\s*\n/).map((block, index) => {
    const heading = /^#{1,6}\s+([\s\S]+)/.exec(block);
    if (heading) return <h3 key={index}>{inlineMarkdown(heading[1])}</h3>;
    const lines = block.split('\n');
    if (lines.every((line) => /^\s*[-*]\s+/.test(line))) {
      return <ul key={index}>{lines.map((line, item) => <li key={item}>{inlineMarkdown(line.replace(/^\s*[-*]\s+/, ''))}</li>)}</ul>;
    }
    if (/^>\s?/.test(block)) return <blockquote key={index}>{inlineMarkdown(block.replace(/^>\s?/gm, ''))}</blockquote>;
    return <p key={index}>{inlineMarkdown(block)}</p>;
  })}</div>;
}
export const StoryEditorialSection: React.FC<Props> = ({ storyMarkdown, storyImageUrl, locationCity, testimonial }) => {
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null);
  const quote = testimonial && hasText(testimonial.quote) ? testimonial : null;
  const photo = [storyImageUrl, quote?.image_url].find(hasText);
  const hasPhoto = !!photo && failedPhoto !== photo;
  const location = [quote?.location, locationCity].find(hasText);
  if (!hasText(storyMarkdown) && !quote && !hasPhoto) return null;
  return (
    <section id="historia" className="journal-section journal-story" aria-labelledby="story-title">
      <div className="journal-container">
        <header className="journal-section-heading">
          <p className="journal-kicker">Más allá de una donación</p>
          <h2 id="story-title" className="journal-display">Una causa.<br /><em>Historias reales.</em></h2>
        </header>
        <div className={'journal-story__layout' + (hasPhoto ? ' journal-story__layout--image' : '')}>
          {hasPhoto && <figure className="journal-story__image">
            <img src={photo} alt={quote?.author_name ? 'Historia de ' + quote.author_name : 'Nuestra causa'} loading="lazy" onError={() => setFailedPhoto(photo!)} />
            {location && <figcaption>{location}</figcaption>}
          </figure>}
          <div className="journal-story__text">
            {hasText(storyMarkdown) && <StoryText text={storyMarkdown} />}
            {quote && <figure className="journal-story__testimonial">
              <span className="journal-story__quote-mark" aria-hidden="true">“</span>
              <blockquote>{quote.quote}</blockquote>
              {(hasText(quote.author_name) || hasText(quote.author_role)) && <figcaption>
                {hasText(quote.author_name) && <strong>{quote.author_name}</strong>}
                {hasText(quote.author_role) && <span>{quote.author_role}</span>}
              </figcaption>}
            </figure>}
          </div>
        </div>
      </div>
    </section>
  );
};
