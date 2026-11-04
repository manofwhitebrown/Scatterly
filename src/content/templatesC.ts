import { entry, strong } from './templateKit';
import type { Template } from './templateKit';

/** Study evenings (world layout v2): the study is part of the case, so it needs the room unlocked. */
export const TEMPLATES_C: Template[] = [
  {
    id: 'late-paperwork', title: 'Late Paperwork', base: 2, start: 'bedroom', needs: ['study'],
    intro: 'A tax form, a deadline and a very quiet study. Your belongings took the quiet personally.',
    targets: ['officeId', 'glasses', 'wallet', 'phone'],
    slots: {
      officeId: { pool: ['study.cabinet', 'study.drawerL', 'study.drawerR', 'study.papers'], items: ['officeId'] },
      glasses: { pool: ['study.desk', 'study.bookshelfL', 'study.bookshelfR', 'study.basket'], items: ['glasses'], habit: 'glasses' },
      wallet: { pool: ['study.cabinet', 'study.drawerL', 'study.papers', 'study.sofa', 'entrance.console'], items: ['wallet'], habit: 'wallet' },
      phone: { pool: ['study.desk', 'study.sofa', 'study.basket', 'living.charger'], items: ['phone'], habit: 'phone' },
      m1: { pool: ['study.papers', 'study.desk', 'study.bookshelfL', 'study.bin'], acts: ['peek', 'lift', 'search'] },
      e1: entry(), e2: entry(),
    },
    steps: [
      { v: 'arrive', room: 'entrance', note: 'You came home determined to finish the form tonight.' },
      { v: 'use', slot: 'officeId', item: 'officeId', note: 'You filed your office ID {w:officeId} so it would be safe.' },
      { v: 'use', slot: 'glasses', item: 'glasses', note: 'You pushed your glasses {w:glasses} to read the small print.' },
      { v: 'drop', slot: 'wallet', item: 'wallet', note: 'You fished out your bank card and left the wallet {w:wallet}.' },
      { v: 'use', slot: 'phone', item: 'phone', note: 'You silenced your phone {w:phone}. Focus.' },
      { v: 'tidy', slot: 'm1', note: 'You scribbled a sum {w:m1} and gave up on it.' },
      { v: 'use', slot: 'e1', note: 'You left a sticky note {w:e1} on the way to bed.' },
      { v: 'use', slot: 'e2', note: 'You wrote tomorrow\'s to-do {w:e2}, mostly aspirational.' },
      { v: 'sleep', room: 'bedroom', note: 'You slept holding a pen, then not.' },
    ],
    clues: [
      { slot: 'e1', icon: 'note', title: 'Sticky note', text: 'Note: the sum is {fact:receipt}. Look {where:m1}, in the study.', links: [strong('m1', 'glasses'), strong('m1', 'wallet')], facts: ['receipt'] },
      { slot: 'm1', icon: 'note', title: 'Scribbled sum', text: 'Total {fact:flat}. Office ID: {where:officeId}. Glasses: {where:glasses}.', links: [strong('officeId', 'officeId'), strong('glasses', 'glasses')], facts: ['flat'] },
      { slot: 'e2', icon: 'text', title: 'To-do list', text: 'Item {fact:page}: wallet {where:wallet}. Phone {where:phone}.', links: [strong('wallet', 'wallet'), strong('phone', 'phone')], facts: ['page'] },
    ],
  },
  {
    id: 'reading-spree', title: 'Reading Spree', base: 2, start: 'bedroom', needs: ['study'],
    intro: 'Four chapters, three cups of tea, and a house that rearranged itself around you.',
    targets: ['glasses', 'earbuds', 'keys', 'bag'],
    slots: {
      glasses: { pool: ['study.sofa', 'study.bookshelfR', 'study.basket', 'study.desk'], items: ['glasses'], habit: 'glasses' },
      earbuds: { pool: ['study.drawerR', 'study.basket', 'study.desk', 'bedroom.bed'], items: ['earbuds'], habit: 'earbuds' },
      keys: { pool: ['study.drawerL', 'study.bookshelfL', 'study.sofa', 'entrance.basket', 'entrance.shelf'], items: ['keys'], habit: 'keys' },
      bag: { pool: ['study.sofa', 'study.cabinet', 'entrance.shoeRack', 'living.sofa'], items: ['bag'] },
      m1: { pool: ['study.papers', 'study.bookshelfL', 'study.bookshelfR', 'study.bin'], acts: ['peek', 'lift', 'search'] },
      e1: entry(), e2: entry(),
    },
    steps: [
      { v: 'arrive', room: 'entrance', note: 'You came in with a library book and a plan.' },
      { v: 'drop', slot: 'keys', item: 'keys', note: 'You dropped your keys {w:keys} mid-chapter.' },
      { v: 'drop', slot: 'bag', item: 'bag', note: 'You parked your bag {w:bag} and settled in.' },
      { v: 'use', slot: 'glasses', item: 'glasses', note: 'You rested your glasses {w:glasses} for one blink.' },
      { v: 'use', slot: 'earbuds', item: 'earbuds', note: 'You tucked your earbuds {w:earbuds} for the quiet.' },
      { v: 'tidy', slot: 'm1', note: 'You slid a bookmark {w:m1}, spine cracked.' },
      { v: 'use', slot: 'e1', note: 'You pencilled a margin note {w:e1}.' },
      { v: 'use', slot: 'e2', note: 'You jotted the page number {w:e2}.' },
      { v: 'sleep', room: 'bedroom', note: 'You slept on chapter four.' },
    ],
    clues: [
      { slot: 'e1', icon: 'note', title: 'Margin note', text: 'Note on page {fact:page}. Bookmark: {where:m1}, in the study.', links: [strong('m1', 'glasses'), strong('m1', 'earbuds')], facts: ['page'] },
      { slot: 'm1', icon: 'note', title: 'Cracked bookmark', text: 'Mark {fact:seat}. Glasses: {where:glasses}. Earbuds: {where:earbuds}.', links: [strong('glasses', 'glasses'), strong('earbuds', 'earbuds')], facts: ['seat'] },
      { slot: 'e2', icon: 'text', title: 'Page jotting', text: 'Page {fact:track}. Keys: {where:keys}. Bag: {where:bag}.', links: [strong('keys', 'keys'), strong('bag', 'bag')], facts: ['track'] },
    ],
  },
];
