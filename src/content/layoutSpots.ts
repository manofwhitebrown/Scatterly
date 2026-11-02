/** [gx, gy] of every interactive spot id (55 house spots + 7 storage-decor slots). Sizes come from KIND_FOOT. */
export const SPOT_POS: Record<string, readonly [number, number]> = {
  // Entrance 8x8
  'entrance.coat1': [0, 0], 'entrance.coat2': [1, 0], 'entrance.jacketPeg': [2, 0], 'entrance.keyHook': [3, 0],
  'entrance.console': [3, 0], 'entrance.shelf': [4, 0], 'entrance.plant': [7, 0], 'entrance.cabinet': [0, 3],
  'entrance.shoeRack': [1, 6], 'entrance.shoeBench': [3, 6], 'entrance.bag': [7, 3], 'entrance.bagHook': [7, 4],
  'entrance.basket': [7, 5], 'entrance.walletBowl': [7, 6], 'entrance.papers': [5, 6], 'entrance.bin': [7, 7],
  // Living 10x8
  'living.bookshelf': [0, 0], 'living.drawer': [2, 0], 'living.charger': [2, 0], 'living.tv': [3, 0],
  'living.displayShelf': [8, 0], 'living.plant': [0, 4], 'living.sofa': [3, 6], 'living.coffeeTable': [3, 3],
  'living.rug': [6, 3], 'living.basket': [8, 6], 'living.bin': [9, 5],
  // Kitchen 9x8
  'kitchen.fridge': [0, 0], 'kitchen.cabinet1': [1, 0], 'kitchen.sink': [2, 0], 'kitchen.drawer1': [4, 0],
  'kitchen.cabinet2': [7, 0], 'kitchen.drawer2': [8, 0], 'kitchen.spiceShelf': [0, 5], 'kitchen.table': [4, 3],
  'kitchen.bagSpot': [7, 4], 'kitchen.basket': [7, 2], 'kitchen.bin': [8, 6], 'kitchen.papers': [2, 6],
  'kitchen.tray': [3, 6],
  // Bedroom 9x8
  'bedroom.wardrobe': [0, 0], 'bedroom.drawerL': [2, 0], 'bedroom.dock': [2, 0], 'bedroom.bed': [3, 0],
  'bedroom.drawerR': [6, 0], 'bedroom.charger': [6, 0], 'bedroom.jacket': [0, 1], 'bedroom.rug': [3, 3],
  'bedroom.laundry': [0, 6], 'bedroom.gymBag': [7, 5], 'bedroom.bin': [8, 6], 'bedroom.papers': [2, 5],
  'bedroom.shoeRack': [4, 7],
  // Bathroom 8x8
  'bathroom.shelf': [0, 0], 'bathroom.sink': [2, 0], 'bathroom.cabinet': [4, 0], 'bathroom.drawer': [5, 0],
  'bathroom.plant': [0, 5], 'bathroom.basket': [0, 7], 'bathroom.bin': [1, 7], 'bathroom.bagSpot': [7, 3],
  'bathroom.papers': [7, 5],
};
