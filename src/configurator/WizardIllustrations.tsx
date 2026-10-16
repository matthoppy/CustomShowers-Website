/**
 * SVG illustrations for the measuring wizard.
 */

interface WizardIllustrationsProps {
  illustrationId: string;
}

export function WizardIllustrations({ illustrationId }: WizardIllustrationsProps) {
  const illustrations: Record<string, JSX.Element> = {
    'alcove-width-bottom': (
      <svg viewBox="0 0 200 150" className="h-auto w-full" aria-hidden="true">
        <line x1="40" y1="30" x2="40" y2="120" stroke="currentColor" strokeWidth="3" className="text-muted-foreground" />
        <line x1="160" y1="30" x2="160" y2="120" stroke="currentColor" strokeWidth="3" className="text-muted-foreground" />
        <rect x="40" y="110" width="120" height="8" fill="currentColor" className="text-muted-foreground/20" />
        <line x1="40" y1="114" x2="160" y2="114" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <path d="M 40 114 L 45 109 M 40 114 L 45 119" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <path d="M 160 114 L 155 109 M 160 114 L 155 119" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <text x="100" y="140" textAnchor="middle" className="fill-muted-foreground text-xs">At tray or floor level</text>
      </svg>
    ),
    'alcove-width-middle': (
      <svg viewBox="0 0 200 150" className="h-auto w-full" aria-hidden="true">
        <line x1="40" y1="30" x2="40" y2="120" stroke="currentColor" strokeWidth="3" className="text-muted-foreground" />
        <line x1="160" y1="30" x2="160" y2="120" stroke="currentColor" strokeWidth="3" className="text-muted-foreground" />
        <line x1="40" y1="75" x2="160" y2="75" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <path d="M 40 75 L 45 70 M 40 75 L 45 80" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <path d="M 160 75 L 155 70 M 160 75 L 155 80" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <text x="100" y="140" textAnchor="middle" className="fill-muted-foreground text-xs">At waist height (~1000mm)</text>
      </svg>
    ),
    'alcove-width-top': (
      <svg viewBox="0 0 200 150" className="h-auto w-full" aria-hidden="true">
        <line x1="40" y1="30" x2="40" y2="120" stroke="currentColor" strokeWidth="3" className="text-muted-foreground" />
        <line x1="160" y1="30" x2="160" y2="120" stroke="currentColor" strokeWidth="3" className="text-muted-foreground" />
        <line x1="40" y1="40" x2="160" y2="40" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <path d="M 40 40 L 45 35 M 40 40 L 45 45" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <path d="M 160 40 L 155 35 M 160 40 L 155 45" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <text x="100" y="140" textAnchor="middle" className="fill-muted-foreground text-xs">At finished glass height</text>
      </svg>
    ),
    'panel-width-bottom': (
      <svg viewBox="0 0 200 150" className="h-auto w-full" aria-hidden="true">
        <line x1="40" y1="30" x2="40" y2="120" stroke="currentColor" strokeWidth="3" className="text-muted-foreground" />
        <line x1="120" y1="30" x2="120" y2="120" stroke="currentColor" strokeWidth="5" className="text-primary" strokeLinecap="round" />
        <rect x="40" y="110" width="80" height="8" fill="currentColor" className="text-muted-foreground/20" />
        <line x1="40" y1="114" x2="120" y2="114" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <path d="M 40 114 L 45 109 M 40 114 L 45 119" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <path d="M 120 114 L 115 109 M 120 114 L 115 119" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <text x="100" y="140" textAnchor="middle" className="fill-muted-foreground text-xs">Panel width at floor</text>
      </svg>
    ),
    'panel-width-top': (
      <svg viewBox="0 0 200 150" className="h-auto w-full" aria-hidden="true">
        <line x1="40" y1="30" x2="40" y2="120" stroke="currentColor" strokeWidth="3" className="text-muted-foreground" />
        <line x1="120" y1="30" x2="120" y2="120" stroke="currentColor" strokeWidth="5" className="text-primary" strokeLinecap="round" />
        <line x1="40" y1="40" x2="120" y2="40" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <path d="M 40 40 L 45 35 M 40 40 L 45 45" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <path d="M 120 40 L 115 35 M 120 40 L 115 45" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <text x="100" y="140" textAnchor="middle" className="fill-muted-foreground text-xs">Panel width at top</text>
      </svg>
    ),
    'return-width-bottom': (
      <svg viewBox="0 0 200 150" className="h-auto w-full" aria-hidden="true">
        <line x1="120" y1="30" x2="120" y2="120" stroke="currentColor" strokeWidth="3" className="text-muted-foreground" />
        <line x1="120" y1="120" x2="160" y2="120" stroke="currentColor" strokeWidth="5" className="text-primary" strokeLinecap="round" />
        <line x1="120" y1="114" x2="160" y2="114" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <path d="M 120 114 L 125 109 M 120 114 L 125 119" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <path d="M 160 114 L 155 109 M 160 114 L 155 119" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <text x="100" y="140" textAnchor="middle" className="fill-muted-foreground text-xs">Return panel at floor</text>
      </svg>
    ),
    'return-width-top': (
      <svg viewBox="0 0 200 150" className="h-auto w-full" aria-hidden="true">
        <line x1="120" y1="30" x2="120" y2="120" stroke="currentColor" strokeWidth="3" className="text-muted-foreground" />
        <line x1="120" y1="40" x2="160" y2="40" stroke="currentColor" strokeWidth="5" className="text-primary" strokeLinecap="round" />
        <line x1="120" y1="40" x2="160" y2="40" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <path d="M 120 40 L 125 35 M 120 40 L 125 45" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <path d="M 160 40 L 155 35 M 160 40 L 155 45" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <text x="100" y="140" textAnchor="middle" className="fill-muted-foreground text-xs">Return panel at top</text>
      </svg>
    ),
    'corner-front-bottom': (
      <svg viewBox="0 0 200 150" className="h-auto w-full" aria-hidden="true">
        <line x1="30" y1="40" x2="170" y2="40" stroke="currentColor" strokeWidth="3" className="text-muted-foreground" />
        <line x1="30" y1="40" x2="30" y2="120" stroke="currentColor" strokeWidth="3" className="text-muted-foreground" />
        <rect x="50" y="110" width="100" height="8" fill="currentColor" className="text-muted-foreground/20" />
        <line x1="50" y1="114" x2="150" y2="114" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <path d="M 50 114 L 55 109 M 50 114 L 55 119" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <path d="M 150 114 L 145 109 M 150 114 L 145 119" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <text x="100" y="140" textAnchor="middle" className="fill-muted-foreground text-xs">Front opening at floor</text>
      </svg>
    ),
    'corner-front-top': (
      <svg viewBox="0 0 200 150" className="h-auto w-full" aria-hidden="true">
        <line x1="30" y1="40" x2="170" y2="40" stroke="currentColor" strokeWidth="3" className="text-muted-foreground" />
        <line x1="30" y1="40" x2="30" y2="120" stroke="currentColor" strokeWidth="3" className="text-muted-foreground" />
        <line x1="50" y1="50" x2="150" y2="50" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <path d="M 50 50 L 55 45 M 50 50 L 55 55" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <path d="M 150 50 L 145 45 M 150 50 L 145 55" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <text x="100" y="140" textAnchor="middle" className="fill-muted-foreground text-xs">Front opening at top</text>
      </svg>
    ),
    'corner-return-bottom': (
      <svg viewBox="0 0 200 150" className="h-auto w-full" aria-hidden="true">
        <line x1="30" y1="40" x2="170" y2="40" stroke="currentColor" strokeWidth="3" className="text-muted-foreground" />
        <line x1="30" y1="40" x2="30" y2="120" stroke="currentColor" strokeWidth="3" className="text-muted-foreground" />
        <line x1="30" y1="114" x2="80" y2="114" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <path d="M 30 114 L 35 109 M 30 114 L 35 119" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <path d="M 80 114 L 75 109 M 80 114 L 75 119" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <text x="100" y="140" textAnchor="middle" className="fill-muted-foreground text-xs">Side return depth at floor</text>
      </svg>
    ),
    'corner-return-top': (
      <svg viewBox="0 0 200 150" className="h-auto w-full" aria-hidden="true">
        <line x1="30" y1="40" x2="170" y2="40" stroke="currentColor" strokeWidth="3" className="text-muted-foreground" />
        <line x1="30" y1="40" x2="30" y2="120" stroke="currentColor" strokeWidth="3" className="text-muted-foreground" />
        <line x1="30" y1="50" x2="80" y2="50" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <path d="M 30 50 L 35 45 M 30 50 L 35 55" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <path d="M 80 50 L 75 45 M 80 50 L 75 55" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <text x="100" y="140" textAnchor="middle" className="fill-muted-foreground text-xs">Side return depth at top</text>
      </svg>
    ),
    'bath-width-bottom': (
      <svg viewBox="0 0 200 150" className="h-auto w-full" aria-hidden="true">
        <rect x="40" y="100" width="120" height="20" rx="3" fill="currentColor" className="text-muted-foreground/20" stroke="currentColor" strokeWidth="2" />
        <line x1="40" y1="100" x2="120" y2="100" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <path d="M 40 100 L 45 95 M 40 100 L 45 105" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <path d="M 120 100 L 115 95 M 120 100 L 115 105" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <text x="100" y="140" textAnchor="middle" className="fill-muted-foreground text-xs">Along bath edge</text>
      </svg>
    ),
    'bath-width-top': (
      <svg viewBox="0 0 200 150" className="h-auto w-full" aria-hidden="true">
        <rect x="40" y="100" width="120" height="20" rx="3" fill="currentColor" className="text-muted-foreground/20" stroke="currentColor" strokeWidth="2" />
        <line x1="40" y1="40" x2="120" y2="40" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <line x1="50" y1="40" x2="50" y2="100" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" className="text-muted-foreground" />
        <line x1="110" y1="40" x2="110" y2="100" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" className="text-muted-foreground" />
        <path d="M 40 40 L 45 35 M 40 40 L 45 45" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <path d="M 120 40 L 115 35 M 120 40 L 115 45" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <text x="100" y="140" textAnchor="middle" className="fill-muted-foreground text-xs">At finished height</text>
      </svg>
    ),
    'laser-wall-vertical': (
      <svg viewBox="0 0 200 150" className="h-auto w-full" aria-hidden="true">
        <line x1="40" y1="30" x2="40" y2="120" stroke="currentColor" strokeWidth="3" className="text-muted-foreground" />
        <line x1="60" y1="30" x2="60" y2="120" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" className="text-destructive" />
        <line x1="60" y1="110" x2="40" y2="110" stroke="currentColor" strokeWidth="1" className="text-primary" />
        <text x="50" y="108" textAnchor="middle" className="fill-primary text-xs font-semibold">Bot</text>
        <line x1="60" y1="75" x2="40" y2="75" stroke="currentColor" strokeWidth="1" className="text-primary" />
        <text x="50" y="73" textAnchor="middle" className="fill-primary text-xs font-semibold">Mid</text>
        <line x1="60" y1="40" x2="40" y2="40" stroke="currentColor" strokeWidth="1" className="text-primary" />
        <text x="50" y="38" textAnchor="middle" className="fill-primary text-xs font-semibold">Top</text>
        <text x="100" y="140" textAnchor="middle" className="fill-muted-foreground text-xs">Vertical laser line, tape gaps</text>
      </svg>
    ),
    'height-reference': (
      <svg viewBox="0 0 200 150" className="h-auto w-full" aria-hidden="true">
        <rect x="70" y="110" width="60" height="3" fill="currentColor" className="text-muted-foreground" />
        <line x1="90" y1="110" x2="90" y2="30" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
        <line x1="110" y1="110" x2="110" y2="30" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
        <line x1="80" y1="35" x2="120" y2="35" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <text x="140" y="38" className="fill-primary text-xs font-semibold">Reference</text>
        <line x1="85" y1="110" x2="85" y2="35" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" className="text-primary" />
        <path d="M 85 35 L 80 40 M 85 35 L 90 40" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <path d="M 85 110 L 80 105 M 85 110 L 90 105" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <text x="100" y="140" textAnchor="middle" className="fill-muted-foreground text-xs">Grout line, door frame, or ceiling</text>
      </svg>
    ),
    'height-vertical': (
      <svg viewBox="0 0 200 150" className="h-auto w-full" aria-hidden="true">
        <rect x="70" y="110" width="60" height="3" fill="currentColor" className="text-muted-foreground" />
        <line x1="100" y1="110" x2="100" y2="35" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" className="text-primary" />
        <path d="M 100 35 L 95 40 M 100 35 L 105 40" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <path d="M 100 110 L 95 105 M 100 110 L 105 105" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <text x="100" y="140" textAnchor="middle" className="fill-muted-foreground text-xs">Measure straight up</text>
      </svg>
    ),
    'shower-head': (
      <svg viewBox="0 0 200 150" className="h-auto w-full" aria-hidden="true">
        <rect x="70" y="110" width="60" height="3" fill="currentColor" className="text-muted-foreground" />
        <circle cx="100" cy="60" r="8" fill="currentColor" className="text-primary" />
        <line x1="100" y1="60" x2="100" y2="68" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <path d="M 95 74 L 100 72 L 105 74" stroke="currentColor" strokeWidth="1.5" className="text-primary" />
        <path d="M 93 78 L 100 75 L 107 78" stroke="currentColor" strokeWidth="1.5" className="text-primary" />
        <line x1="85" y1="110" x2="85" y2="60" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" className="text-primary" />
        <path d="M 85 60 L 80 65 M 85 60 L 90 65" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <path d="M 85 110 L 80 105 M 85 110 L 90 105" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <text x="100" y="140" textAnchor="middle" className="fill-muted-foreground text-xs">Outlet or rail top height</text>
      </svg>
    ),
    'spirit-level': (
      <svg viewBox="0 0 200 150" className="h-auto w-full" aria-hidden="true">
        <line x1="60" y1="30" x2="60" y2="120" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
        <line x1="65" y1="40" x2="65" y2="120" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" className="text-primary" />
        <rect x="50" y="65" width="30" height="10" rx="2" fill="currentColor" className="text-primary/40" stroke="currentColor" strokeWidth="1" />
        <circle cx="65" cy="70" r="2" fill="currentColor" className="text-primary" />
        <text x="100" y="140" textAnchor="middle" className="fill-muted-foreground text-xs">Hold level against wall</text>
      </svg>
    ),
    'floor-type': (
      <svg viewBox="0 0 200 150" className="h-auto w-full" aria-hidden="true">
        <rect x="50" y="90" width="100" height="8" fill="currentColor" className="text-primary/20" />
        <rect x="50" y="98" width="100" height="20" fill="currentColor" className="text-muted-foreground/30" />
        <line x1="80" y1="70" x2="80" y2="90" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
        <line x1="120" y1="70" x2="120" y2="90" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
        <text x="100" y="140" textAnchor="middle" className="fill-muted-foreground text-xs">Tray, wet room, or bath</text>
      </svg>
    ),
    'obstacles': (
      <svg viewBox="0 0 200 150" className="h-auto w-full" aria-hidden="true">
        <rect x="40" y="40" width="40" height="30" stroke="currentColor" strokeWidth="2" fill="currentColor" className="text-muted-foreground/20" />
        <line x1="60" y1="40" x2="60" y2="70" stroke="currentColor" strokeWidth="1" className="text-muted-foreground" />
        <line x1="40" y1="55" x2="80" y2="55" stroke="currentColor" strokeWidth="1" className="text-muted-foreground" />
        <rect x="120" y="90" width="40" height="30" rx="2" fill="currentColor" className="text-muted-foreground/20" stroke="currentColor" strokeWidth="2" />
        <line x1="125" y1="95" x2="155" y2="115" stroke="currentColor" strokeWidth="1" className="text-destructive" />
        <line x1="155" y1="95" x2="125" y2="115" stroke="currentColor" strokeWidth="1" className="text-destructive" />
        <text x="100" y="140" textAnchor="middle" className="fill-muted-foreground text-xs">Windows, radiators, slopes</text>
      </svg>
    ),
    'generic-width-bottom': (
      <svg viewBox="0 0 200 150" className="h-auto w-full" aria-hidden="true">
        <rect x="40" y="110" width="120" height="8" fill="currentColor" className="text-muted-foreground/20" />
        <line x1="40" y1="114" x2="160" y2="114" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <path d="M 40 114 L 45 109 M 40 114 L 45 119" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <path d="M 160 114 L 155 109 M 160 114 L 155 119" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <text x="100" y="140" textAnchor="middle" className="fill-muted-foreground text-xs">Main dimension at floor</text>
      </svg>
    ),
    'generic-width-top': (
      <svg viewBox="0 0 200 150" className="h-auto w-full" aria-hidden="true">
        <line x1="40" y1="40" x2="160" y2="40" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <path d="M 40 40 L 45 35 M 40 40 L 45 45" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <path d="M 160 40 L 155 35 M 160 40 L 155 45" stroke="currentColor" strokeWidth="2" className="text-primary" />
        <text x="100" y="140" textAnchor="middle" className="fill-muted-foreground text-xs">Main dimension at top</text>
      </svg>
    ),
  };

  return illustrations[illustrationId] || illustrations['generic-width-bottom'];
}
