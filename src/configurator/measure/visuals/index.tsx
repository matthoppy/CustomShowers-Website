import type { CardVisual } from '../cards';
import { CrossReadingVisual } from './CrossReadingVisual';
import { HeightVisual } from './HeightVisual';
import { LaserSetupVisual } from './LaserSetupVisual';
import { MarksVisual } from './MarksVisual';

/** Picture height of the glass or the ceiling, from the real size. */
function pictureHeight(glassMm: number, toCeiling: boolean): number {
  return toCeiling ? 176 : Math.max(120, Math.min(160, glassMm * 0.075));
}

/** The picture for a card, given what has been typed and what is done. */
export function CardPicture({ visual, value, done, glassMm }: { visual: CardVisual; value: number | null; done: number[]; glassMm: number }) {
  switch (visual.kind) {
    case 'marks':
      return <MarksVisual height={pictureHeight(glassMm, false)} />;
    case 'laser-setup':
      return <LaserSetupVisual height={pictureHeight(glassMm, visual.toCeiling)} toCeiling={visual.toCeiling} />;
    case 'cross-reading':
      return <CrossReadingVisual point={visual.point} height={pictureHeight(glassMm, visual.toCeiling)} toCeiling={visual.toCeiling} value={value} done={done} />;
    case 'height':
      return <HeightVisual height={pictureHeight(value ?? glassMm, false)} value={value} />;
  }
}
