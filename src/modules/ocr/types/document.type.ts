export type DocumentType = 'digitel' | 'banesco_pago_terceros';

type Rect = { left: number; top: number; width: number; height: number };

export type DocumentsMap = Record<DocumentType, { rectangles: Rect[] }>;
