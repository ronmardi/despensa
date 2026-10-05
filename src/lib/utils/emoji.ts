/**
 * Emoji para productos de la despensa.
 *
 * Ubicación sugerida: src/lib/utils/emoji.ts
 * Uso:  getProductEmoji(item.name, item.category)
 *
 * Cómo funciona
 *  - El nombre se normaliza: minúsculas, sin tildes ni ñ (piña -> pina), sin signos.
 *  - Se recorre RULES en orden y gana la PRIMERA coincidencia, por eso las reglas
 *    específicas ("pasta de dientes", "salsa de tomate") van antes que las genéricas
 *    ("pasta", "tomate").
 *  - Las palabras clave se escriben SIN tildes y en singular. Se aceptan plurales
 *    (s / es) automáticamente.
 *  - Un asterisco final es comodín de sufijo: "lava*" -> lavaloza, lavavajillas...
 *  - Si ninguna regla coincide, se usa el emoji de la categoría. Y si tampoco, 📦.
 */

type Rule = readonly [emoji: string, keywords: readonly string[]]

const RULES: readonly Rule[] = [
  // ═════════ 0. Excepciones que deben ir antes de todo ═════════
  ['🌭', ['perro caliente', 'hot dog', 'hotdog']],

  // ═════════ A. MASCOTAS (primero: "comida de gato sabor pollo" no debe ser 🍗) ═════════
  ['🦴', ['hueso', 'snack para perro', 'premio para perro']],
  ['🐱', ['gato', 'gatito', 'felino', 'arena sanitaria', 'whiskas', 'cat chow']],
  ['🐶', ['perro', 'cachorro', 'canino', 'dog chow', 'pedigree']],
  ['🐠', ['acuario', 'comida para peces', 'alimento para peces', 'alimento para pez', 'comida de pez']],
  ['🐦', ['pajaro', 'alpiste', 'canario', 'loro', 'periquito']],
  ['🐰', ['conejo', 'hamster', 'cuy', 'cobaya']],
  ['🐢', ['tortuga']],
  ['🐾', ['mascota', 'antipulgas', 'antiparasitario', 'collar', 'correa']],

  // ═════════ B. FRASES COMPUESTAS (deben ganarle a palabras sueltas) ═════════
  ['🌭', ['vienesa', 'salchicha', 'longaniza', 'chorizo']],
  ['🪥', ['pasta de dientes', 'pasta dental', 'crema dental', 'dentifrico', 'cepillo de dientes', 'cepillo dental', 'enjuague bucal', 'hilo dental', 'colutorio']],
  ['🩹', ['agua oxigenada', 'alcohol', 'curita', 'parche', 'gasa', 'venda', 'algodon', 'termometro']],
  ['🥤', ['agua tonica', 'tonica']],
  ['🧴', ['agua micelar', 'crema corporal', 'crema de manos', 'crema facial', 'crema de peinar', 'crema para peinar', 'locion']],
  ['🥜', ['mantequilla de mani', 'crema de mani']],
  ['🥫', ['salsa de tomate', 'pure de tomate', 'pasta de tomate', 'tomate triturado', 'tomate en lata']],
  ['🍽️', ['papel aluminio', 'papel film', 'film plastico', 'papel manteca', 'papel mantequilla', 'papel craft', 'bolsa ziploc', 'ziploc', 'aluminio']],
  ['🍕', ['pizza']],
  ['🍔', ['hamburguesa']],
  ['🥟', ['empanada', 'pastel de choclo', 'pastelito']],
  ['🍲', ['sopa', 'caldo', 'cazuela', 'consome']],
  ['🍜', ['ramen', 'fideo instantaneo', 'sopa instantanea']],

  // ═════════ C. ASEO PERSONAL Y LIMPIEZA (antes que comida: "jabón de avena", "shampoo de manzana") ═════════
  // Aseo personal
  ['🧴', ['shampoo', 'champu', 'acondicionador', 'bloqueador', 'protector solar', 'desodorante', 'perfume', 'colonia', 'gel para el pelo', 'cera para el pelo', 'laca', 'crema para el cuerpo']],
  ['🪒', ['maquinilla', 'afeitadora', 'rasuradora', 'espuma de afeitar', 'gillette', 'cuchilla de afeitar']],
  ['🌸', ['toalla higienica', 'tampon', 'protector diario', 'copa menstrual', 'ambientador', 'aromatizante', 'desodorante ambiental']],
  ['🍼', ['panal', 'toallita humeda', 'mamadera', 'formula infantil', 'leche de formula', 'papilla']],
  ['💊', ['paracetamol', 'ibuprofeno', 'medicamento', 'remedio', 'pastilla', 'vitamina', 'aspirina', 'antibiotico', 'jarabe para la tos', 'suplemento']],
  ['😷', ['mascarilla', 'barbijo']],
  ['💅', ['esmalte', 'quitaesmalte', 'lima de unas']],
  ['💄', ['maquillaje', 'labial', 'rimel', 'base de maquillaje']],
  ['🧼', ['jabon*', 'gel de ducha', 'gel de bano', 'detergente', 'lavaloza', 'lava loza', 'lava*', 'quitamanchas', 'lavavajilla']],
  // Limpieza del hogar
  ['🧺', ['suavizante', 'lavanderia', 'ropa', 'canasto']],
  ['🧽', ['esponja', 'estropajo', 'virutilla', 'pano', 'pano de cocina', 'pano multiuso']],
  ['🧻', ['papel higienico', 'papel confort', 'papel de bano', 'toalla de papel', 'papel de cocina', 'toalla nova', 'servilleta', 'panuelo', 'papel']],
  ['🗑️', ['bolsa de basura', 'basura', 'bolsa de residuo']],
  ['🪣', ['balde', 'cubeta']],
  ['🧤', ['guante']],
  ['🪰', ['insecticida', 'raid', 'mata moscas', 'antipolilla']],
  ['🕯️', ['vela', 'velon', 'fosforo', 'encendedor']],
  ['🔋', ['pila', 'bateria']],
  ['💡', ['ampolleta', 'foco', 'bombilla', 'lampara']],
  ['🧹', ['escoba', 'mopa', 'trapero', 'pala de basura', 'cloro', 'desinfectante', 'desinfect*', 'limpia*', 'limpiador', 'desengrasante', 'amoniaco', 'lysoform', 'cif', 'sapolio', 'destapacanerias']],

  // ═════════ D. BEBIDAS ═════════
  ['🧉', ['yerba mate', 'yerba', 'mate']],
  ['☕', ['cafe', 'nescafe', 'capuchino', 'espresso', 'cafe molido', 'cafe instantaneo', 'descafeinado']],
  ['🍵', ['te', 'infusion', 'manzanilla', 'boldo', 'matcha', 'rooibos', 'agua de hierbas', 'menta poleo', 'tilo']],
  ['🧃', ['jugo', 'nectar', 'zumo', 'smoothie', 'jugo en polvo', 'kapo', 'yupi', 'zuko']],
  ['🥤', ['bebida', 'gaseosa', 'soda', 'refresco', 'coca cola', 'cocacola', 'coca', 'fanta', 'sprite', 'pepsi', 'bilz', 'ginger ale', 'energetica', 'isotonica', 'gatorade', 'powerade', 'redbull', 'red bull', 'monster', 'malta']],
  ['🍺', ['cerveza', 'chela', 'cerveza artesanal', 'lager', 'ipa', 'schop', 'stout']],
  ['🍷', ['vino', 'tinto', 'carmenere', 'cabernet', 'merlot', 'sauvignon', 'chardonnay', 'rosado', 'sangria', 'borgona']],
  ['🍾', ['espumante', 'champagne', 'champana', 'prosecco']],
  ['🥃', ['pisco', 'whisky', 'whiskey', 'ron', 'vodka', 'gin', 'tequila', 'licor', 'conac', 'brandy', 'fernet', 'aguardiente', 'mistela']],
  ['🧊', ['hielo']],
  ['💧', ['agua', 'agua mineral', 'agua con gas', 'agua sin gas', 'bidon de agua']],

  // ═════════ E. LÁCTEOS Y HUEVOS ═════════
  ['🥚', ['huevo', 'huevo de codorniz', 'clara de huevo', 'yema']],
  ['🧀', ['queso', 'quesillo', 'mozzarella', 'mozarela', 'parmesano', 'cheddar', 'ricotta', 'gouda', 'mantecoso', 'gauda', 'cabra', 'brie', 'camembert', 'philadelphia', 'cottage', 'fondue', 'roquefort', 'provolone', 'chanco']],
  ['🧈', ['mantequilla', 'margarina', 'manteca', 'ghee']],
  ['🍨', ['helado', 'sorbete', 'paleta helada', 'cassata', 'magnum']],
  ['🍮', ['flan', 'budin', 'natilla', 'gelatina', 'panacota', 'postre de leche', 'leche asada']],
  ['🥛', ['leche', 'leche en polvo', 'leche condensada', 'leche evaporada', 'leche de almendra', 'leche de avena', 'leche de soya', 'leche vegetal', 'yogur*', 'kefir', 'crema', 'nata', 'crema de leche', 'lacteo', 'batido', 'ricota', 'suero', 'colun', 'soprole', 'nestle']],

  // ═════════ F. PREPARADOS, PANADERÍA Y DULCES ═════════
  // Pan y masas
  ['🥖', ['baguette', 'pan frances', 'ciabatta']],
  ['🥐', ['croissant', 'medialuna', 'berlin', 'cachito']],
  ['🫓', ['pan pita', 'tortilla', 'wrap', 'arepa', 'pan arabe', 'naan', 'lavash']],
  ['🥪', ['sandwich', 'sandwiche', 'emparedado', 'tostadita', 'churrasco']],
  ['🥞', ['panqueque', 'hotcake', 'pancake', 'crepe', 'crepa']],
  ['🧇', ['waffle', 'gofre']],
  ['🥯', ['bagel', 'rosca']],
  ['🍞', ['pan', 'marraqueta', 'hallulla', 'pan amasado', 'pan de molde', 'pan integral', 'pan rallado', 'pan hamburguesa', 'pan de hotdog', 'pan pascua', 'tostada', 'colisa', 'pan de campo', 'dobladita']],
  // Galletas y postres (antes que cereal/chocolate: "galleta de avena", "torta de chocolate")
  ['🍪', ['galleta', 'oreo', 'trencito', 'tritón', 'triton', 'cracker', 'soda cracker', 'galletita', 'cookie', 'obleas', 'oblea']],
  ['🧁', ['cupcake', 'muffin', 'magdalena']],
  ['🍩', ['dona', 'donut', 'rosquilla']],
  ['🍰', ['torta', 'queque', 'keke', 'pastel', 'brownie', 'bizcocho', 'kuchen', 'cheesecake', 'tarta', 'alfajor', 'panqueque de manjar', 'tres leches', 'mil hojas', 'milhojas', 'pie']],
  // Cereales
  ['🥣', ['cereal', 'avena', 'granola', 'muesli', 'copos', 'corn flakes', 'cornflakes', 'zucaritas', 'chocapic', 'quaker', 'barra de cereal', 'papilla de avena']],
  // Dulces
  ['🍫', ['chocolate', 'cacao', 'nutella', 'cobertura', 'bombon', 'trufa', 'sahne nuss', 'sahne-nuss', 'kitkat', 'milka', 'snickers', 'cacao en polvo']],
  ['🍬', ['dulce', 'caramelo', 'chicle', 'gomita', 'malvavisco', 'chupete', 'confite', 'pastilla de menta', 'azucar', 'endulzante', 'stevia', 'sucralosa', 'chancaca', 'azucar flor', 'azucar granulada', 'sacarina']],
  ['🍯', ['miel', 'manjar', 'dulce de leche', 'maple', 'melaza']],
  ['🍓', ['mermelada', 'confitura', 'jalea', 'compota']],
  // Snacks
  ['🍿', ['cabritas', 'palomitas', 'popcorn', 'pop corn', 'pochoclo']],
  ['🍟', ['papas fritas', 'papa frita', 'chips', 'snack', 'ramitas', 'doritos', 'lays', 'ganchitos', 'cheetos', 'fritura', 'nachos', 'tortilla chips', 'papas bastón', 'papas bastones']],
  ['🥨', ['pretzel', 'galleta salada', 'palito salado', 'cracker salado']],

  // ═════════ I. DESPENSA SECA ═════════
  ['🍚', ['arroz', 'arroz integral', 'risotto']],
  ['🍝', ['pasta', 'fideo', 'tallarin', 'spaghetti', 'espagueti', 'macarron', 'lasana', 'lasagna', 'penne', 'fusilli', 'ravioles', 'raviol', 'noqui', 'noquis', 'canelones', 'cabello de angel', 'rigatoni', 'tortellini', 'coditos', 'corbata', 'tornillo', 'conchitas', 'fetuccini', 'fettuccine', 'pastas']],
  ['🫘', ['poroto', 'lenteja', 'garbanzo', 'frejol', 'frijol', 'haba', 'alubia', 'legumbre', 'soya', 'soja', 'edamame', 'hummus', 'frijoles', 'porotos granados']],
  ['🌾', ['harina', 'trigo', 'maicena', 'semola', 'levadura', 'polvo de hornear', 'bicarbonato', 'sal de frutas', 'masa', 'centeno', 'quinoa', 'quinua', 'cuscus', 'couscous', 'bulgur', 'sagu', 'tapioca', 'harina de trigo', 'harina tostada']],
  ['🫒', ['aceite', 'aceite de oliva', 'aceite de maravilla', 'aceite de coco', 'aceite vegetal', 'oliva', 'aceituna', 'olivas']],
  ['🫙', ['mayonesa', 'ketchup', 'catsup', 'mostaza', 'vinagre', 'aderezo', 'salsa', 'pepinillo', 'encurtido', 'chimichurri', 'pebre', 'salsa de soya', 'salsa bbq', 'barbacoa', 'tahini', 'pesto', 'ali oli', 'alioli', 'rocoto', 'chucrut', 'alcaparra', 'palmito']],
  ['🧂', ['sal', 'sal de mar', 'sal marina', 'sal gruesa', 'pimienta', 'condimento', 'especia', 'comino', 'paprika', 'curry', 'canela', 'clavo de olor', 'nuez moscada', 'merken', 'colorante', 'ajo en polvo', 'cebolla en polvo', 'sazonador', 'sazon', 'knorr', 'maggi', 'adobo', 'oregano seco', 'pimienta negra', 'pimienta blanca', 'azafran', 'vainilla', 'esencia']],
  ['🥜', ['mani', 'nuez', 'nueces', 'almendra', 'pistacho', 'avellana', 'castana de caju', 'marañon', 'maranon', 'frutos secos', 'fruto seco', 'semilla', 'chia', 'linaza', 'sesamo', 'girasol', 'pepa', 'mix de nueces', 'pina de pino', 'pinon', 'macadamia']],
  ['🌰', ['castana']],
  ['🍇', ['pasa', 'uva pasa', 'orejon', 'higo seco', 'datil', 'ciruela seca', 'ciruela deshidratada', 'deshidratado']],

  // ═════════ G. CARNES Y PESCADOS ═════════
  ['🍗', ['pollo', 'pavo', 'pechuga', 'muslo', 'trutro', 'alita', 'nugget', 'ave de corral', 'pato', 'gallina', 'milanesa de pollo', 'pollo asado', 'pollo entero', 'ala de pollo', 'filete de pollo']],
  ['🥓', ['tocino', 'panceta', 'bacon', 'tocineta', 'jamon', 'mortadela', 'salame', 'salami', 'fiambre', 'cecina', 'pate', 'jamon serrano', 'prosciutto', 'pepperoni', 'longaniza ahumada', 'pernil', 'prieta', 'arrollado']],
  ['🍖', ['costilla', 'costillar', 'asado de tira', 'cordero', 'chuleta', 'cerdo', 'lechon', 'pernil de cerdo', 'osobuco', 'lomo de cerdo', 'jamon pierna']],
  ['🥩', ['carne', 'bistec', 'bife', 'lomo', 'filete', 'asado', 'posta', 'entrana', 'carne molida', 'molida', 'vacuno', 'res', 'ternera', 'vacio', 'punta de ganso', 'plateada', 'huachalomo', 'sobrecostilla', 'palanca', 'ganso', 'abastero', 'tapapecho', 'carne de res', 'hamburguesa casera', 'albondiga', 'higado', 'guatita', 'lengua', 'rinon', 'charqui', 'cabrito']],
  ['🍣', ['sashimi', 'maki', 'nigiri', 'roll de salmon', 'california roll']],
  ['🐟', ['pescado', 'salmon', 'merluza', 'atun', 'jurel', 'reineta', 'congrio', 'tilapia', 'trucha', 'sardina', 'anchoa', 'bacalao', 'pejerrey', 'corvina', 'surimi', 'lenguado', 'robalo', 'dorado', 'mero', 'filete de pescado', 'palometa', 'bonito', 'caballa', 'pez espada', 'albacora', 'sierra', 'cojinova']],
  ['🦐', ['camaron', 'langostino', 'gamba', 'marisco', 'camarones', 'centolla', 'jaiba', 'cangrejo', 'erizo', 'picoroco', 'crustaceo']],
  ['🦞', ['langosta', 'bogavante', 'langosta de mar']],
  ['🦑', ['calamar', 'jibia', 'pota']],
  ['🐙', ['pulpo']],
  ['🦪', ['almeja', 'choro', 'mejillon', 'ostra', 'ostion', 'macha', 'cholga', 'navajuela', 'lapa', 'piure']],

  // ═════════ H. FRUTAS Y VERDURAS ═════════
  // Frutas
  ['🍎', ['manzana', 'manzana roja', 'manzana verde', 'fuji', 'granny smith', 'pink lady', 'royal gala']],
  ['🍐', ['pera', 'pera de agua', 'nashi']],
  ['🍊', ['naranja', 'mandarina', 'clementina', 'pomelo', 'toronja', 'tangerina', 'kumquat']],
  ['🍋', ['limon', 'lima', 'limon de pica', 'lima limon', 'citrico', 'bergamota']],
  ['🍌', ['platano', 'banana', 'banano', 'guineo', 'cambur', 'platano macho']],
  ['🍇', ['uva', 'uva verde', 'uva roja', 'uva negra', 'racimo']],
  ['🍓', ['frutilla', 'fresa', 'frambuesa', 'zarzaparrilla']],
  ['🫐', ['arandano', 'mora', 'murta', 'maqui', 'berries', 'cranberry', 'grosella', 'cassis', 'calafate']],
  ['🍑', ['durazno', 'melocoton', 'damasco', 'albaricoque', 'nectarina', 'ciruela', 'pelon', 'paraguayo', 'nispero']],
  ['🍒', ['cereza', 'guinda', 'picota']],
  ['🍉', ['sandia', 'patilla']],
  ['🍈', ['melon', 'melon tuna', 'melon calameno', 'cantalupo', 'honeydew']],
  ['🍍', ['pina', 'anana', 'ananas']],
  ['🥭', ['mango', 'papaya', 'maracuya', 'chirimoya', 'guayaba', 'lucuma', 'granada', 'fruta de la pasion', 'pitahaya', 'fruta del dragon', 'tamarindo', 'carambola', 'lichi', 'rambutan', 'guanabana']],
  ['🥝', ['kiwi']],
  ['🥥', ['coco', 'coco rallado', 'agua de coco']],
  ['🥑', ['palta', 'aguacate', 'palta hass', 'palta fuerte']],
  ['🍎', ['fruta', 'frutas', 'fruta fresca', 'surtido de frutas', 'frutas de temporada']],
  // Verduras
  ['🍅', ['tomate', 'tomate cherry', 'tomate perita', 'tomate en rama', 'tomates', 'cherry']],
  ['🥕', ['zanahoria', 'zanahoria baby', 'zanahorias']],
  ['🥔', ['papa', 'patata', 'papa nueva', 'papa rosada', 'papa blanca', 'papas', 'papa amarilla', 'papa colorada', 'papa chilota', 'papa pavo']],
  ['🍠', ['camote', 'batata', 'boniato', 'yuca', 'mandioca', 'malanga']],
  ['🧅', ['cebolla', 'cebolla morada', 'cebolla blanca', 'cebolla de verdeo', 'cebolleta', 'chalota', 'chalote', 'cebolla perla', 'cebolla dulce']],
  ['🧄', ['ajo', 'diente de ajo', 'cabeza de ajo', 'ajo chilote', 'ajo negro']],
  ['🥦', ['brocoli', 'brocolli', 'coliflor', 'brecol', 'romanesco', 'repollitos de bruselas', 'col de bruselas']],
  ['🥬', ['lechuga', 'repollo', 'acelga', 'espinaca', 'kale', 'apio', 'col', 'rucula', 'berro', 'endibia', 'achicoria', 'lechuga costina', 'escarola', 'radicchio', 'lechuga escarola', 'lechuga hidroponica', 'bok choy', 'pak choi', 'col rizada', 'col morada', 'repollo morado', 'lechuga morada', 'lechuga costina', 'lechuga romana', 'lechuga italiana', 'mix de hojas', 'mix de lechugas', 'hoja verde', 'hojas verdes', 'ensalada verde', 'mezclum']],
  ['🥒', ['pepino', 'zapallo italiano', 'zapallito', 'calabacin', 'pepino de ensalada', 'zucchini', 'zapallito italiano', 'chayote']],
  ['🌽', ['choclo', 'maiz', 'elote', 'mazorca', 'choclito', 'choclo congelado', 'choclo en grano', 'granos de choclo', 'humitas', 'humita', 'maiz dulce']],
  ['🍆', ['berenjena']],
  ['🫑', ['pimenton', 'pimiento', 'pimenton rojo', 'pimenton verde', 'pimenton amarillo', 'morron', 'locote', 'pimiento morron', 'ajies dulces', 'aji dulce']],
  ['🌶️', ['aji', 'chile', 'jalapeno', 'aji cacho de cabra', 'aji verde', 'cacho de cabra', 'habanero', 'chile fresco', 'aji rojo', 'rocoto fresco']],
  ['🍄', ['champinon', 'hongo', 'seta', 'portobello', 'shiitake', 'loyo', 'morchela', 'champinones']],
  ['🎃', ['zapallo', 'calabaza', 'zapallo camote', 'zapallo de guarda', 'butternut', 'zapallo en cubos', 'calabaza moscada']],
  ['🌱', ['arveja', 'haba verde', 'poroto verde', 'poroto granado', 'brote', 'brotes', 'germinado', 'alfalfa', 'esparrago', 'esparragos', 'vainita', 'judia verde', 'ejote', 'chaucha', 'alcachofa', 'betarraga', 'remolacha', 'rabano', 'nabo', 'puerro', 'hinojo', 'colinabo', 'topinambur', 'tofu', 'tempeh', 'verduras congeladas', 'mix de verduras', 'verdura', 'verduras', 'verdura fresca']],
  ['🌿', ['perejil', 'cilantro', 'albahaca', 'oregano', 'romero', 'tomillo', 'menta', 'hierbabuena', 'laurel', 'eneldo', 'cebollin', 'ciboulette', 'estragon', 'salvia', 'ruda', 'cedron', 'citronela', 'hierba', 'hierbas', 'hierbas finas', 'huacatay', 'paico', 'toronjil']],
  ['🥗', ['ensalada', 'ensalada mixta', 'ensalada lista', 'bowl', 'ensalada cesar', 'ensalada de frutas']],

  // ═════════ J. RESPALDO GENÉRICO ═════════
  ['🥫', ['conserva*', 'enlatado', 'lata']],
  ['🍽️', ['plato', 'cubierto', 'tenedor', 'cuchara', 'cuchillo', 'vaso', 'taza', 'plato desechable', 'vaso desechable', 'bandeja', 'tupper', 'tuper', 'bolsa de plastico', 'cubierto desechable']],
]

// ──────────────────────────────────────────────────────────────────────────
// Respaldo por categoría (para cuando el nombre no coincide con ninguna regla)
// ──────────────────────────────────────────────────────────────────────────

const CATEGORY_EMOJI: readonly (readonly [prefix: string, emoji: string])[] = [
  ['despensa', '🥫'],
  ['lacteo', '🥛'],
  ['huevo', '🥚'],
  ['fruta', '🍎'],
  ['verdura', '🥬'],
  ['carne', '🥩'],
  ['pescado', '🐟'],
  ['bebida', '🥤'],
  ['limpieza', '🧹'],
  ['aseo', '🧴'],
  ['mascota', '🐾'],
  ['otro', '📦'],
]

// ──────────────────────────────────────────────────────────────────────────
// Motor
// ──────────────────────────────────────────────────────────────────────────

const STOPWORDS = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'para', 'con', 'en', 'y', 'a', 'al', 'sin'])

/** minúsculas, sin tildes ni ñ, sin signos, espacios simples */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s*]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const escapeRegex = (s: string) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')

function keywordToPattern(raw: string): string {
  const kw = normalize(raw)
  // Comodín de sufijo: "lava*" -> lava\w*
  if (kw.endsWith('*')) return escapeRegex(kw.slice(0, -1)) + '\\w*'
  // Cada palabra admite plural (s/es), salvo conectores como "de", "con", "para"
  return kw
    .split(' ')
    .map((w) => (STOPWORDS.has(w) ? escapeRegex(w) : escapeRegex(w) + '(?:s|es)?'))
    .join('\\s+')
}

const COMPILED: readonly (readonly [emoji: string, re: RegExp])[] = RULES.map(
  ([emoji, keywords]) => {
    // Las frases más largas primero, para que "pasta de dientes" no pierda contra "pasta"
    const patterns = [...new Set(keywords.map(keywordToPattern))]
      .filter((p) => p.length > 0)
      .sort((a, b) => b.length - a.length)
    return [emoji, new RegExp(`\\b(?:${patterns.join('|')})\\b`)] as const
  }
)

export function getCategoryEmoji(category?: string | null): string {
  if (!category) return '📦'
  const c = normalize(category)
  return CATEGORY_EMOJI.find(([prefix]) => c.startsWith(prefix))?.[1] ?? '📦'
}

export function getProductEmoji(name: string, category?: string | null): string {
  const n = normalize(name)
  if (n) {
    for (const [emoji, re] of COMPILED) {
      if (re.test(n)) return emoji
    }
  }
  return getCategoryEmoji(category)
}