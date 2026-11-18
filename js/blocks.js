/**
 * Справочник блоков: русские названия, цвета для 3D-предпросмотра,
 * категории и таблица legacy-ID (старый формат .schematic).
 */

const DYE_RU = {
    white: 'Белый', orange: 'Оранжевый', magenta: 'Пурпурный', light_blue: 'Голубой',
    yellow: 'Жёлтый', lime: 'Лаймовый', pink: 'Розовый', gray: 'Серый',
    light_gray: 'Светло-серый', cyan: 'Бирюзовый', purple: 'Фиолетовый', blue: 'Синий',
    brown: 'Коричневый', green: 'Зелёный', red: 'Красный', black: 'Чёрный'
};

const DYE_HEX = {
    white: 0xe9ecec, orange: 0xf07613, magenta: 0xbd44b3, light_blue: 0x3aafd9,
    yellow: 0xf8c627, lime: 0x70b919, pink: 0xed8dac, gray: 0x3e4447,
    light_gray: 0x8e8e86, cyan: 0x158991, purple: 0x792aac, blue: 0x35399d,
    brown: 0x724728, green: 0x546d1b, red: 0xa12722, black: 0x141519
};

const SHAPE_RU = {
    stairs: 'Ступеньки', slab: 'Плита', wall: 'Стена', fence: 'Забор',
    fence_gate: 'Калитка', door: 'Дверь', trapdoor: 'Люк', button: 'Кнопка',
    pressure_plate: 'Нажимная плита', sign: 'Табличка', carpet: 'Ковёр',
    pane: 'Панель', bars: 'Решётка', chain: 'Цепь', lantern: 'Фонарь'
};

const MATERIAL_RU = {
    wool: 'шерсть', concrete: 'бетон', concrete_powder: 'бетонная пыль',
    terracotta: 'терракота', stained_glass: 'стекло', stained_glass_pane: 'панель стекла',
    carpet: 'ковёр', bed: 'кровать', candle: 'свеча', shulker_box: 'шалкер',
    glass_pane: 'панель стекла'
};

const BASE_COLORS = {
    stone: 0x7f7f7f, smooth_stone: 0xa0a0a0, cobblestone: 0x7a7a7a, mossy_cobblestone: 0x6a7a5a,
    granite: 0x9a6b5b, polished_granite: 0x9d6c5c, diorite: 0xc3c3c3, polished_diorite: 0xcdcdcd,
    andesite: 0x8a8a8a, polished_andesite: 0x9a9a9a, deepslate: 0x4b4b50, cobbled_deepslate: 0x4d4d52,
    polished_deepslate: 0x57575c, deepslate_bricks: 0x46464a, deepslate_tiles: 0x36363a,
    tuff: 0x6b6f66, chiseled_tuff: 0x66695f, calcite: 0xdfdfda, dripstone_block: 0x866b5a,
    dirt: 0x79553a, coarse_dirt: 0x77553b, rooted_dirt: 0x906e4f, grass_block: 0x6a9e3f,
    podzol: 0x5f3f1f, mycelium: 0x6f6265, mud: 0x3c3a3f, clay: 0xa0a6b3, gravel: 0x837f7f,
    sand: 0xdbd3a0, red_sand: 0xbf6c2a, sandstone: 0xd9d1a1, red_sandstone: 0xbb6a2d,
    snow_block: 0xf0fafa, snow: 0xf0fafa, ice: 0x9cc6f2, packed_ice: 0x8db9e8, blue_ice: 0x74a3e8,
    bedrock: 0x565656, obsidian: 0x14121f, crying_obsidian: 0x221556, netherrack: 0x6d3535,
    soul_sand: 0x52413a, soul_soil: 0x4b3a33, magma_block: 0x8e3f1c, glowstone: 0xc9a24a,
    shroomlight: 0xe0a05a, basalt: 0x4b4a51, smooth_basalt: 0x4b4a51, blackstone: 0x2f2a30,
    polished_blackstone: 0x35313a, gilded_blackstone: 0x3a2f28, end_stone: 0xdbdf9e,
    purpur_block: 0xa97ca9, purpur_pillar: 0xb083b0, quartz_block: 0xeee7e0,
    smooth_quartz: 0xece6df, prismarine: 0x5f9d93, dark_prismarine: 0x335d4e,
    sea_lantern: 0xb6ccc7, bricks: 0x97594a, mud_bricks: 0x8a6a52, nether_bricks: 0x301a1e,
    red_nether_bricks: 0x460709, iron_block: 0xd8d8d8, gold_block: 0xf6d34a,
    diamond_block: 0x61dcd2, emerald_block: 0x29d36a, lapis_block: 0x1d4790,
    redstone_block: 0xa7150a, coal_block: 0x101010, copper_block: 0xc16f4e,
    oxidized_copper: 0x4f9b7e, weathered_copper: 0x6ca88a, exposed_copper: 0xa77a5e,
    amethyst_block: 0x8561bf, glass: 0xc8e6ea, tinted_glass: 0x2d2a2d, water: 0x2f5fd0,
    lava: 0xe05a12, oak_planks: 0xb08a55, spruce_planks: 0x6d4f2f, birch_planks: 0xd6c48d,
    jungle_planks: 0xb4754f, acacia_planks: 0xb05d32, dark_oak_planks: 0x4b3018,
    mangrove_planks: 0x7a3f31, cherry_planks: 0xe0b3b0, bamboo_planks: 0xc5ae55,
    crimson_planks: 0x6f3b52, warped_planks: 0x2e6b6a, oak_log: 0x6b532f,
    spruce_log: 0x4b3620, birch_log: 0xd7cfa8, jungle_log: 0x564728, acacia_log: 0x676157,
    dark_oak_log: 0x3b2a17, mangrove_log: 0x5a3a2a, cherry_log: 0x3c2020, bamboo_block: 0xa9a24a,
    crimson_stem: 0x5c2f43, warped_stem: 0x2a4c4c, bookshelf: 0x6f5736, crafting_table: 0x7a5a3a,
    furnace: 0x6a6a6a, chest: 0x9c7f44, barrel: 0x8d6b45, hay_block: 0xc6a72c,
    moss_block: 0x597d36, vine: 0x3d6b25, oak_leaves: 0x4d7a2a, spruce_leaves: 0x3d5c2c,
    birch_leaves: 0x6d8f45, jungle_leaves: 0x3f7a1e, acacia_leaves: 0x5c8a2e,
    dark_oak_leaves: 0x3a5f1c, mangrove_leaves: 0x4f7a2a, cherry_leaves: 0xe29ab4,
    azalea_leaves: 0x5a7a3a, flower_azalea_leaves: 0x6a8a4a, bamboo: 0x8a9c3a,
    sugar_cane: 0x8fbf6a, cactus: 0x5c8a2e, melon: 0x6f8a2a, pumpkin: 0xc07615,
    nether_wart_block: 0x700c0c, warped_wart_block: 0x167e86, honey_block: 0xe59a1a,
    slime_block: 0x6fbf5f, sponge: 0xc3c34d, wet_sponge: 0x9aa53a,
    target: 0xc9b9a9, note_block: 0x5c4028, jukebox: 0x5c4028, bookshelf_jungle: 0x6f5736,
    brick_stairs: 0x97594a, end_stone_bricks: 0xd9dda1, netherite_block: 0x3c3436,
    ancient_debris: 0x5c4a42, lodestone: 0x7f7f83, respawn_anchor: 0x2b1a4a,
    crafting_table_top: 0x7a5a3a, smithing_table: 0x3f3f46, cartography_table: 0x6b5a45,
    fletching_table: 0xb9a86a, lectern: 0x9a7b4f, stonecutter: 0x7a7a72, loom: 0xb08a55,
    composter: 0x8a5a34, beehive: 0xb59554, bee_nest: 0xa8823f,
    sea_pickle: 0x5f8a4a, coral_block: 0xd85a7a, tube_coral_block: 0x3157c7,
    brain_coral_block: 0xc7508f, bubble_coral_block: 0xa82fc7, fire_coral_block: 0xa3262b,
    horn_coral_block: 0xc7b31e, dead_tube_coral_block: 0x7a6a5a
};

const RU_NAMES = {
    stone: 'Камень', smooth_stone: 'Гладкий камень', cobblestone: 'Булыжник',
    mossy_cobblestone: 'Замшелый булыжник', granite: 'Гранит', polished_granite: 'Полированный гранит',
    diorite: 'Диорит', polished_diorite: 'Полированный диорит', andesite: 'Андезит',
    polished_andesite: 'Полированный андезит', deepslate: 'Глубинный сланец',
    cobbled_deepslate: 'Булыжный глубинный сланец', polished_deepslate: 'Полированный глубинный сланец',
    deepslate_bricks: 'Кирпичи из глубинного сланца', deepslate_tiles: 'Плитка из глубинного сланца',
    tuff: 'Туф', chiseled_tuff: 'Резной туф', calcite: 'Кальцит', dripstone_block: 'Капельник',
    dirt: 'Земля', coarse_dirt: 'Грубая земля', rooted_dirt: 'Земля с корнями',
    grass_block: 'Травяной блок', podzol: 'Подзол', mycelium: 'Мицелий', mud: 'Грязь',
    clay: 'Глина', gravel: 'Гравий', sand: 'Песок', red_sand: 'Красный песок',
    sandstone: 'Песчаник', red_sandstone: 'Красный песчаник', snow_block: 'Снежный блок',
    snow: 'Снег', ice: 'Лёд', packed_ice: 'Плотный лёд', blue_ice: 'Синий лёд',
    bedrock: 'Бедрок', obsidian: 'Обсидиан', crying_obsidian: 'Плачущий обсидиан',
    netherrack: 'Незерак', soul_sand: 'Песок душ', soul_soil: 'Почва душ',
    magma_block: 'Магма', glowstone: 'Светокамень', shroomlight: 'Грибной свет',
    basalt: 'Базальт', smooth_basalt: 'Гладкий базальт', blackstone: 'Чернит',
    polished_blackstone: 'Полированный чернит', gilded_blackstone: 'Золочёный чернит',
    end_stone: 'Энд-камень', purpur_block: 'Пурпур', purpur_pillar: 'Пурпурная колонна',
    quartz_block: 'Кварцевый блок', smooth_quartz: 'Гладкий кварц', prismarine: 'Призмарин',
    dark_prismarine: 'Тёмный призмарин', sea_lantern: 'Морской фонарь', bricks: 'Кирпичи',
    mud_bricks: 'Грязевые кирпичи', nether_bricks: 'Незерские кирпичи',
    red_nether_bricks: 'Красные незерские кирпичи', iron_block: 'Железный блок',
    gold_block: 'Золотой блок', diamond_block: 'Алмазный блок', emerald_block: 'Изумрудный блок',
    lapis_block: 'Лазуритовый блок', redstone_block: 'Блок редстоуна', coal_block: 'Угольный блок',
    copper_block: 'Медный блок', oxidized_copper: 'Окисленная медь', weathered_copper: 'Состаренная медь',
    exposed_copper: 'Обнажённая медь', amethyst_block: 'Аметистовый блок', glass: 'Стекло',
    tinted_glass: 'Тонированное стекло', water: 'Вода', lava: 'Лава',
    oak_planks: 'Дубовые доски', spruce_planks: 'Еловые доски', birch_planks: 'Берёзовые доски',
    jungle_planks: 'Доски из тропического дерева', acacia_planks: 'Акациевые доски',
    dark_oak_planks: 'Доски из тёмного дуба', mangrove_planks: 'Мангровые доски',
    cherry_planks: 'Вишнёвые доски', bamboo_planks: 'Бамбуковые доски',
    crimson_planks: 'Багровые доски', warped_planks: 'Искажённые доски',
    oak_log: 'Дубовое бревно', spruce_log: 'Еловое бревно', birch_log: 'Берёзовое бревно',
    jungle_log: 'Бревно тропического дерева', acacia_log: 'Акациевое бревно',
    dark_oak_log: 'Бревно тёмного дуба', mangrove_log: 'Мангровое бревно',
    cherry_log: 'Вишнёвое бревно', bamboo_block: 'Бамбуковый блок', crimson_stem: 'Багровый стебель',
    warped_stem: 'Искажённый стебель', bookshelf: 'Книжная полка', crafting_table: 'Верстак',
    furnace: 'Печь', chest: 'Сундук', barrel: 'Бочка', hay_block: 'Сноп сена',
    moss_block: 'Блок мха', vine: 'Лианы', oak_leaves: 'Дубовая листва',
    spruce_leaves: 'Еловая листва', birch_leaves: 'Берёзовая листва',
    jungle_leaves: 'Листва тропического дерева', acacia_leaves: 'Акациевая листва',
    dark_oak_leaves: 'Листва тёмного дуба', mangrove_leaves: 'Мангровая листва',
    cherry_leaves: 'Вишнёвая листва', azalea_leaves: 'Листва азалии',
    flower_azalea_leaves: 'Цветущая листва азалии', bamboo: 'Бамбук', sugar_cane: 'Сахарный тростник',
    cactus: 'Кактус', melon: 'Арбуз', pumpkin: 'Тыква', nether_wart_block: 'Блок незерского нароста',
    warped_wart_block: 'Искажённый нарост', honey_block: 'Медовый блок', slime_block: 'Блок слизи',
    sponge: 'Губка', wet_sponge: 'Мокрая губка', target: 'Мишень', note_block: 'Нотный блок',
    jukebox: 'Проигрыватель', netherite_block: 'Незеритовый блок', ancient_debris: 'Древние обломки',
    lodestone: 'Магнетит', respawn_anchor: 'Якорь возрождения', smithing_table: 'Кузнечный стол',
    cartography_table: 'Стол картографа', fletching_table: 'Стол лучника', lectern: 'Кафедра',
    stonecutter: 'Камнерез', loom: 'Ткацкий станок', composter: 'Компостер',
    beehive: 'Улей', bee_nest: 'Пчелиное гнездо', sea_pickle: 'Морской огурец',
    tube_coral_block: 'Блок трубчатого коралла', brain_coral_block: 'Блок мозгового коралла',
    bubble_coral_block: 'Блок пузырчатого коралла', fire_coral_block: 'Блок огненного коралла',
    horn_coral_block: 'Блок рогатого коралла', dead_tube_coral_block: 'Мёртвый трубчатый коралл',
    decorated_pot: 'Украшенный горшок', flower_pot: 'Цветочный горшок', torch: 'Факел',
    soul_torch: 'Факел душ', lantern: 'Фонарь', soul_lantern: 'Фонарь душ',
    sea_lantern2: 'Морской фонарь', end_rod: 'Энд-стержень', beacon: 'Маяк',
    conduit: 'Проводник', respawn_anchor2: 'Якорь возрождения', campfire: 'Костёр',
    soul_campfire: 'Костёр душ', scaffolding: 'Строительные леса', ladder: 'Лестница',
    rail: 'Рельсы', powered_rail: 'Энергорельсы', detector_rail: 'Рельсы с датчиком',
    activator_rail: 'Активирующие рельсы', iron_bars: 'Железные прутья',
    iron_door: 'Железная дверь', iron_trapdoor: 'Железный люк',
    glass_pane: 'Стеклянная панель', tinted_glass_pane: 'Тонированная панель',
    white_wool: 'Белая шерсть', orange_wool: 'Оранжевая шерсть', magenta_wool: 'Пурпурная шерсть',
    light_blue_wool: 'Голубая шерсть', yellow_wool: 'Жёлтая шерсть', lime_wool: 'Лаймовая шерсть',
    pink_wool: 'Розовая шерсть', gray_wool: 'Серая шерсть', light_gray_wool: 'Светло-серая шерсть',
    cyan_wool: 'Бирюзовая шерсть', purple_wool: 'Фиолетовая шерсть', blue_wool: 'Синяя шерсть',
    brown_wool: 'Коричневая шерсть', green_wool: 'Зелёная шерсть', red_wool: 'Красная шерсть',
    black_wool: 'Чёрная шерсть'
};

const CATEGORY_RULES = [
    ['wool', ['wool', 'carpet']],
    ['clay', ['terracotta', 'glazed', 'clay', 'brick']],
    ['wood', ['plank', 'log', 'wood', 'stem', 'fence', 'door', 'trapdoor', 'bookshelf', 'barrel', 'chest', 'crafting_table', 'bamboo', 'sapling']],
    ['glass', ['glass', 'pane']],
    ['metal', ['iron', 'gold', 'copper', 'diamond', 'emerald', 'lapis', 'netherite', 'amethyst', 'quartz', 'anvil', 'cauldron', 'hopper', 'rail']],
    ['plants', ['leaves', 'grass', 'flower', 'moss', 'vine', 'cactus', 'sugar_cane', 'coral', 'mushroom', 'wheat', 'hay', 'pumpkin', 'melon', 'wart']],
    ['redstone', ['redstone', 'piston', 'observer', 'repeater', 'comparator', 'dispenser', 'dropper', 'command_block', 'lever', 'button', 'pressure_plate', 'note_block', 'target', 'lamp']],
    ['nether', ['nether', 'soul', 'basalt', 'blackstone', 'crimson', 'warped', 'magma', 'glowstone', 'obsidian', 'ancient_debris', 'shroomlight']],
    ['stone', ['stone', 'deepslate', 'granite', 'diorite', 'andesite', 'tuff', 'calcite', 'cobble', 'sandstone', 'sand', 'dirt', 'gravel', 'bedrock', 'prismarine', 'purpur', 'end_stone']]
];

const LEGACY_IDS = {
    1: 'stone', 2: 'grass_block', 3: 'dirt', 4: 'cobblestone', 5: 'oak_planks', 6: 'oak_sapling',
    7: 'bedrock', 8: 'water', 9: 'water', 10: 'lava', 11: 'lava', 12: 'sand', 13: 'gravel',
    14: 'gold_ore', 15: 'iron_ore', 16: 'coal_ore', 17: 'oak_log', 18: 'oak_leaves', 19: 'sponge',
    20: 'glass', 21: 'lapis_ore', 22: 'lapis_block', 23: 'dispenser', 24: 'sandstone',
    25: 'note_block', 26: 'red_bed', 27: 'powered_rail', 28: 'detector_rail', 29: 'sticky_piston',
    30: 'cobweb', 31: 'grass', 32: 'dead_bush', 33: 'piston', 34: 'piston_head', 35: 'white_wool',
    37: 'dandelion', 38: 'poppy', 39: 'brown_mushroom', 40: 'red_mushroom', 41: 'gold_block',
    42: 'iron_block', 43: 'smooth_stone', 44: 'stone_slab', 45: 'bricks', 46: 'tnt',
    47: 'bookshelf', 48: 'mossy_cobblestone', 49: 'obsidian', 50: 'torch', 51: 'fire',
    52: 'spawner', 53: 'oak_stairs', 54: 'chest', 55: 'redstone_wire', 56: 'diamond_ore',
    57: 'diamond_block', 58: 'crafting_table', 59: 'wheat', 60: 'farmland', 61: 'furnace',
    62: 'furnace', 63: 'oak_sign', 64: 'oak_door', 65: 'ladder', 66: 'rail', 67: 'cobblestone_stairs',
    68: 'oak_wall_sign', 69: 'lever', 70: 'stone_pressure_plate', 71: 'iron_door',
    72: 'oak_pressure_plate', 73: 'redstone_ore', 74: 'redstone_ore', 75: 'redstone_torch',
    76: 'redstone_torch', 77: 'stone_button', 78: 'snow', 79: 'ice', 80: 'snow_block',
    81: 'cactus', 82: 'clay', 83: 'sugar_cane', 84: 'jukebox', 85: 'oak_fence', 86: 'pumpkin',
    87: 'netherrack', 88: 'soul_sand', 89: 'glowstone', 90: 'nether_portal', 91: 'jack_o_lantern',
    92: 'cake', 93: 'repeater', 94: 'repeater', 95: 'white_stained_glass', 96: 'oak_trapdoor',
    98: 'stone_bricks', 99: 'brown_mushroom_block', 100: 'red_mushroom_block', 101: 'iron_bars',
    102: 'glass_pane', 103: 'melon', 104: 'pumpkin_stem', 105: 'melon_stem', 106: 'vine',
    107: 'oak_fence_gate', 108: 'brick_stairs', 109: 'stone_brick_stairs', 110: 'mycelium',
    111: 'lily_pad', 112: 'nether_bricks', 113: 'nether_brick_fence', 114: 'nether_brick_stairs',
    115: 'nether_wart', 116: 'enchanting_table', 117: 'brewing_stand', 118: 'cauldron',
    119: 'end_portal', 120: 'end_portal_frame', 121: 'end_stone', 122: 'dragon_egg',
    123: 'redstone_lamp', 124: 'redstone_lamp', 125: 'dropper', 126: 'oak_slab',
    128: 'sandstone_stairs', 129: 'emerald_ore', 130: 'ender_chest', 131: 'tripwire_hook',
    132: 'tripwire', 133: 'emerald_block', 134: 'spruce_stairs', 135: 'birch_stairs',
    136: 'jungle_stairs', 137: 'command_block', 138: 'beacon', 139: 'cobblestone_wall',
    140: 'flower_pot', 141: 'carrots', 142: 'potatoes', 143: 'oak_button', 144: 'skeleton_skull',
    145: 'anvil', 146: 'trapped_chest', 147: 'light_weighted_pressure_plate',
    148: 'heavy_weighted_pressure_plate', 149: 'comparator', 150: 'comparator', 151: 'daylight_detector',
    152: 'redstone_block', 153: 'nether_quartz_ore', 154: 'hopper', 155: 'quartz_block',
    156: 'quartz_stairs', 157: 'activator_rail', 158: 'dropper', 159: 'white_terracotta',
    160: 'white_stained_glass_pane', 161: 'acacia_leaves', 162: 'acacia_log', 163: 'acacia_stairs',
    164: 'dark_oak_stairs', 165: 'slime_block', 166: 'barrier', 167: 'iron_trapdoor',
    168: 'prismarine', 169: 'sea_lantern', 170: 'hay_block', 171: 'white_carpet',
    172: 'white_terracotta', 173: 'coal_block', 174: 'packed_ice', 175: 'sunflower',
    176: 'white_banner', 177: 'white_wall_banner', 178: 'daylight_detector', 179: 'red_sandstone',
    180: 'red_sandstone_stairs', 181: 'red_sandstone_slab', 182: 'spruce_fence_gate',
    183: 'birch_fence_gate', 184: 'jungle_fence_gate', 185: 'dark_oak_fence_gate',
    186: 'acacia_fence_gate', 187: 'spruce_fence', 188: 'birch_fence', 189: 'jungle_fence',
    190: 'dark_oak_fence', 191: 'acacia_fence', 192: 'spruce_door', 193: 'birch_door',
    194: 'jungle_door', 195: 'acacia_door', 196: 'dark_oak_door', 197: 'end_rod',
    198: 'chorus_plant', 199: 'chorus_flower', 200: 'purpur_block', 201: 'purpur_pillar',
    202: 'purpur_stairs', 203: 'purpur_slab', 204: 'purpur_double_slab', 205: 'end_stone_bricks',
    206: 'beetroots', 207: 'dirt_path', 208: 'end_gateway', 209: 'repeating_command_block',
    210: 'chain_command_block', 211: 'frosted_ice', 212: 'magma_block', 213: 'nether_wart_block',
    214: 'red_nether_bricks', 215: 'bone_block', 216: 'structure_void', 217: 'observer',
    218: 'white_shulker_box', 219: 'orange_shulker_box', 220: 'magenta_shulker_box',
    221: 'light_blue_shulker_box', 222: 'yellow_shulker_box', 223: 'lime_shulker_box',
    224: 'pink_shulker_box', 225: 'gray_shulker_box', 226: 'light_gray_shulker_box',
    227: 'cyan_shulker_box', 228: 'purple_shulker_box', 229: 'blue_shulker_box',
    230: 'brown_shulker_box', 231: 'green_shulker_box', 232: 'red_shulker_box',
    233: 'black_shulker_box', 235: 'white_glazed_terracotta', 236: 'orange_glazed_terracotta',
    237: 'magenta_glazed_terracotta', 238: 'light_blue_glazed_terracotta',
    239: 'yellow_glazed_terracotta', 240: 'lime_glazed_terracotta', 241: 'pink_glazed_terracotta',
    242: 'gray_glazed_terracotta', 243: 'light_gray_glazed_terracotta', 244: 'cyan_glazed_terracotta',
    245: 'purple_glazed_terracotta', 246: 'blue_glazed_terracotta', 247: 'brown_glazed_terracotta',
    248: 'green_glazed_terracotta', 249: 'red_glazed_terracotta', 250: 'black_glazed_terracotta',
    251: 'white_concrete', 252: 'white_concrete_powder'
};

const DYE_SUFFIXES = ['wool', 'concrete', 'concrete_powder', 'terracotta', 'stained_glass',
    'stained_glass_pane', 'carpet', 'bed', 'candle', 'shulker_box', 'glazed_terracotta'];

export function stripNamespace(id) {
    if (!id) return 'unknown';
    return String(id).replace(/^minecraft:/, '');
}

export function baseId(id) {
    return stripNamespace(id).replace(/\[.*\]$/, '');
}

function prettify(id) {
    return id.split('_').filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

function splitDye(id) {
    for (const dye of Object.keys(DYE_RU)) {
        if (id === dye) return { dye, rest: '' };
        if (id.startsWith(dye + '_')) {
            return { dye, rest: id.slice(dye.length + 1) };
        }
    }
    return null;
}

/** Красивое русское (или английское) название материала. */
export function displayName(rawId) {
    const id = baseId(rawId);
    if (RU_NAMES[id]) return RU_NAMES[id];

    const dye = splitDye(id);
    if (dye && DYE_SUFFIXES.includes(dye.rest)) {
        const mat = MATERIAL_RU[dye.rest] || dye.rest;
        return `${DYE_RU[dye.dye]} ${mat}`;
    }

    // Составные названия: <цвет>_<что-то>, <форма> и т.п.
    const parts = id.split('_');
    const last = parts[parts.length - 1];
    const last2 = parts.slice(-2).join('_');
    if (SHAPE_RU[last] || SHAPE_RU[last2]) {
        const shape = SHAPE_RU[last2] || SHAPE_RU[last];
        const restId = id.slice(0, id.length - (SHAPE_RU[last2] ? last2.length : last.length) - 1);
        const rest = RU_NAMES[restId] || prettify(restId);
        return `${shape}: ${rest}`;
    }
    return prettify(id);
}

/** Цвет блока для 3D-предпросмотра. */
export function colorFor(rawId) {
    const id = baseId(rawId);
    if (BASE_COLORS[id]) return BASE_COLORS[id];

    // Цветные варианты (шерсть, бетон, терракота, стекло...)
    for (const dye of Object.keys(DYE_HEX)) {
        if (id.startsWith(dye + '_')) {
            const rest = id.slice(dye.length + 1);
            if (DYE_SUFFIXES.includes(rest) || rest === 'glazed_terracotta' ||
                rest.endsWith('_glazed_terracotta') || rest === 'banner' || rest.endsWith('_banner') ||
                rest === 'wall_banner' || rest === 'concrete_powder') {
                let c = DYE_HEX[dye];
                if (rest.includes('terracotta')) c = mix(c, 0x8a5a43, 0.45);
                if (rest.includes('concrete') && !rest.includes('powder')) c = mix(c, 0xffffff, 0.05);
                if (rest.includes('glass')) c = mix(c, 0xffffff, 0.35);
                return c;
            }
        }
    }

    // Родственные блоки: ступеньки/плиты/стены наследуют цвет основы
    const suffixes = ['_stairs', '_slab', '_wall', '_fence_gate', '_fence', '_door', '_trapdoor',
        '_button', '_pressure_plate', '_sign', '_wall_sign', '_carpet', '_pane', '_bars'];
    for (const s of suffixes) {
        if (id.endsWith(s)) {
            const base = id.slice(0, -s.length);
            if (BASE_COLORS[base]) return BASE_COLORS[base];
            if (base.endsWith('_bricks') && BASE_COLORS[base.replace(/_bricks$/, '')]) {
                return mix(BASE_COLORS[base.replace(/_bricks$/, '')], 0x000000, 0.1);
            }
        }
    }

    // Листва и трава
    if (id.includes('leaves') || id === 'grass' || id.includes('vine') || id.includes('moss')) {
        return 0x4f7a2c;
    }
    if (id.includes('water')) return BASE_COLORS.water;
    if (id.includes('lava')) return BASE_COLORS.lava;
    if (id.includes('glass')) return 0xc8e6ea;
    if (id.includes('planks') || id.includes('_wood')) return 0x9a7448;
    if (id.includes('log') || id.includes('stem')) return 0x5b4227;
    if (id.includes('ore')) return 0x6a6a6a;
    if (id.includes('concrete')) return 0x9a9a9a;
    if (id.includes('terracotta')) return 0x8a5a43;
    if (id.includes('coral')) return 0xc75a7a;

    return hashColor(id);
}

export function isTransparent(rawId) {
    const id = baseId(rawId);
    return id.includes('glass') || id === 'water' || id === 'ice' || id.includes('leaves') ||
        id === 'air' || id === 'cave_air' || id === 'void_air' || id.includes('portal') ||
        id === 'barrier' || id === 'structure_void' || id === 'light' || id.endsWith('_torch') ||
        id.includes('coral') || id.includes('vine');
}

export function isAir(rawId) {
    const id = baseId(rawId);
    return id === 'air' || id === 'cave_air' || id === 'void_air' || id === 'structure_void';
}

/** Категория по умолчанию (id категории из списка приложения). */
export function guessCategory(rawId) {
    const id = baseId(rawId);
    for (const [cat, words] of CATEGORY_RULES) {
        if (words.some(w => id.includes(w))) return cat;
    }
    return 'other';
}

export function legacyName(id) {
    return LEGACY_IDS[id] || `legacy_block_${id}`;
}

function mix(a, b, t) {
    const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
    const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
    return (Math.round(ar + (br - ar) * t) << 16) |
        (Math.round(ag + (bg - ag) * t) << 8) |
        Math.round(ab + (bb - ab) * t);
}

function hashColor(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    const hue = h % 360;
    const sat = 0.25 + ((h >> 8) % 25) / 100;
    const light = 0.45 + ((h >> 16) % 20) / 100;
    return hslToHex(hue / 360, sat, light);
}

function hslToHex(h, s, l) {
    const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
    const g = Math.round(hue2rgb(p, q, h) * 255);
    const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);
    return (r << 16) | (g << 8) | b;
}
