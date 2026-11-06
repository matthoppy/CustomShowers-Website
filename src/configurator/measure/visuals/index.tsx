import type { CardVisual } from '../cards';
import { CrossReadingVisual } from './CrossReadingVisual';
import { HeightVisual } from './HeightVisual';
import { LaserSetupVisual } from './LaserSetupVisual';
import { TapeLineVisual } from './TapeLineVisual';

/** The picture for a card, given what has been typed and what is done. */
export function CardPicture({ visual, value, done }: { visual: CardVisual; value: number | null; done: number[] }) {
  switch (visual.kind) {
    case 'tape-line':
      return <TapeLineVisual />;
    case 'laser-setup':
      return <LaserSetupVisual toCeiling={visual.toCeiling} />;
    case 'cross-reading':
      return <CrossReadingVisual point={visual.point} toCeiling={visual.toCeiling} value={value} done={done} />;
    case 'height':
      return <HeightVisual value={value} />;
  }
}
