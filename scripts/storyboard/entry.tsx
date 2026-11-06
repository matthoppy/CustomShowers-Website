/**
 * Renders the measuring cards for a single door, measured with a laser, as
 * static HTML frames: the proposal of the screen flow, built from the real
 * components with sample numbers. Built by scripts/storyboard/build.mjs.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { createInitialState, type ConfiguratorState } from '@/configurator/types';
import { buildCards, readField, readingCards, writeField } from '@/configurator/measure/cards';
import { MeasureCard } from '@/configurator/measure/MeasureCard';
import { MeasureReview } from '@/configurator/measure/MeasureReview';
import { CardPicture } from '@/configurator/measure/visuals';

const SAMPLE: Record<string, number> = {
  leftBottomMm: 598,
  leftTopMm: 594,
  rightBottomMm: 602,
  rightTopMm: 601,
  floorLeftMm: 1004,
  floorRightMm: 1010,
  ceilingLeftMm: 1396,
  ceilingRightMm: 1402,
};

function sampleState(): ConfiguratorState {
  let state = createInitialState(10);
  state = { ...state, isFloorToCeiling: true, topGapMm: 30, opening: { ...state.opening, method: 'laser' } };
  for (const [key, v] of Object.entries(SAMPLE)) state = writeField(state, { kind: 'cross', key: key as keyof typeof SAMPLE & string } as never, v);
  return state;
}

export interface FrameOut {
  caption: string;
  html: string;
  kind: 'card' | 'review';
}

export function renderStoryboard(): { frames: FrameOut[]; standardHeight: FrameOut[] } {
  const state = sampleState();
  const cards = buildCards(state);
  const readings = readingCards(cards);
  const noop = () => undefined;
  const frames: FrameOut[] = [];

  cards.forEach((card, i) => {
    if (card.kind === 'review') {
      frames.push({ caption: `Screen ${i + 1} · Review`, kind: 'review', html: renderToStaticMarkup(<MeasureReview state={state} cards={cards} onEdit={noop} onConfirm={noop} />) });
      return;
    }
    const value = card.field ? readField(state, card.field) : null;
    const done = readings.filter((r) => (r.readingIndex ?? 0) < (card.readingIndex ?? 99)).map((r) => (r.visual?.kind === 'cross-reading' ? r.visual.point : 0)).filter(Boolean);
    const visual = card.visual ? <CardPicture visual={card.visual} value={value} done={done} /> : null;
    frames.push({
      caption: `Screen ${i + 1} · ${card.kind === 'reading' ? `Reading ${card.readingIndex} of ${readings.length}` : 'Instruction'}`,
      kind: 'card',
      html: renderToStaticMarkup(
        <MeasureCard card={card} step={i + 1} stepCount={cards.length} readingCount={readings.length} value={value} onChange={noop} onNext={noop} onBack={noop} canBack={i > 0} visual={visual} />
      ),
    });
  });

  // The same door, not to the ceiling: six readings and a height.
  let standard = createInitialState(10);
  standard = { ...standard, isFloorToCeiling: false, heightMm: 2000, opening: { ...standard.opening, method: 'laser' } };
  for (const [key, v] of Object.entries(SAMPLE).slice(0, 6)) standard = writeField(standard, { kind: 'cross', key } as never, v);
  const stdCards = buildCards(standard);
  const stdReadings = readingCards(stdCards);
  const standardHeight: FrameOut[] = stdCards
    .filter((c) => c.id === 'height' || c.id === 'cross-2' || c.id === 'review')
    .map((card) => {
      const i = stdCards.indexOf(card);
      if (card.kind === 'review') return { caption: 'Review, standard height', kind: 'review' as const, html: renderToStaticMarkup(<MeasureReview state={standard} cards={stdCards} onEdit={noop} onConfirm={noop} />) };
      const value = card.field ? readField(standard, card.field) : null;
      return {
        caption: `Screen ${i + 1} · Reading ${card.readingIndex} of ${stdReadings.length}`,
        kind: 'card' as const,
        html: renderToStaticMarkup(
          <MeasureCard card={card} step={i + 1} stepCount={stdCards.length} readingCount={stdReadings.length} value={value} onChange={noop} onNext={noop} onBack={noop} canBack visual={card.visual ? <CardPicture visual={card.visual} value={value} done={[1]} /> : null} />
        ),
      };
    });

  return { frames, standardHeight };
}
