import { TEMPLATES_A } from './templatesA';
import { TEMPLATES_B } from './templatesB';
import { TEMPLATES_C } from './templatesC';
import type { Template } from './templateKit';

export type { ClueDef, LinkDef, SlotDef, StepDef, Template } from './templateKit';

/** 20 handcrafted evening recipes: 8 gentle, 7 chained, 3 puzzle-heavy. */
export const TEMPLATES: Template[] = [...TEMPLATES_A, ...TEMPLATES_B, ...TEMPLATES_C];
