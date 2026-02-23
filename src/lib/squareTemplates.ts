export interface SquareTemplate {
    id: string;
    name: string;
    description: string;
    baseType: string;
}

export const SQUARE_TEMPLATES: SquareTemplate[] = [
    { id: 'l-left', name: 'Return Left + Door', description: 'Start with a left return and a standard door', baseType: 'l-left' },
    { id: 'l-right', name: 'Door + Return Right', description: 'Start with a standard door and a right return', baseType: 'l-right' },
];
