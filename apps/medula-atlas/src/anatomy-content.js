/** Contenido de regiones, raíces y cubiertas. Las coordenadas son solo docentes. */
export const anatomySources = {
  external: { title: 'Purves et al. · Anatomía externa de la médula', url: 'https://www.ncbi.nlm.nih.gov/books/NBK11160/' },
  roots: { title: 'OpenStax · Nervios espinales', url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/13-4-the-peripheral-nervous-system' },
  coverings: { title: 'NCBI Bookshelf · Meninges espinales', url: 'https://www.ncbi.nlm.nih.gov/books/NBK547755/' },
  circulation: { title: 'OpenStax · Meninges y LCR', url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/13-3-circulation-and-the-central-nervous-system' },
  internal: { title: 'OpenStax · Organización de la médula', url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/13-2-the-central-nervous-system' },
  phrenic: { title: 'NCBI Bookshelf · Nervios frénicos', url: 'https://www.ncbi.nlm.nih.gov/books/NBK513325/' },
  pelvic: { title: 'NCBI Bookshelf · Nervios esplácnicos', url: 'https://www.ncbi.nlm.nih.gov/books/NBK560504/' },
  coccygeal: { title: 'Woon y Stringer · Redefining the coccygeal plexus', url: 'https://pubmed.ncbi.nlm.nih.gov/23554024/' }
};

export const regions = [
  { id:'cervical', name:'Cervical', range:'C1–C8', count:8, prefix:'C', color:'#8173a8', start:64, end:166,
    anatomy:'Ocho segmentos medulares y ocho pares de nervios cervicales. La columna tiene siete vértebras cervicales.',
    connectivity:'Sus raíces conectan con cuello y miembros superiores. C8 sale entre las vértebras C7 y T1.',
    function:'Participa en sensibilidad y movimiento del cuello y los miembros superiores. C3–C5 contribuyen al nervio frénico.',
    clinical:'Una lesión cervical puede comprometer brazos y piernas; en niveles altos también puede afectar la respiración.',
    sources:['external','roots','phrenic'] },
  { id:'thoracic', name:'Torácica', range:'T1–T12', count:12, prefix:'T', color:'#b7874b', start:166, end:331,
    anatomy:'Doce segmentos medulares y doce pares de nervios torácicos. El corte del explorador representa T3.',
    connectivity:'Las raíces torácicas se continúan con nervios que inervan gran parte de la pared torácica y abdominal.',
    function:'Integra sensibilidad del tronco y actividad de sus músculos. Incluye circuitos de salida simpática.',
    clinical:'Una lesión torácica puede afectar tronco y miembros inferiores. Su nivel vertebral no identifica por sí solo el segmento medular lesionado.',
    sources:['external','roots','internal'] },
  { id:'lumbar', name:'Lumbar', range:'L1–L5', count:5, prefix:'L', color:'#588b79', start:331, end:383,
    anatomy:'Cinco segmentos medulares y cinco pares de nervios lumbares. En el adulto, estos segmentos se encuentran por encima de las vértebras lumbares del mismo número.',
    connectivity:'Sus raíces descienden hacia sus puntos de salida y contribuyen a los plexos que conectan con el miembro inferior.',
    function:'Participa en sensibilidad, movimiento y reflejos de los miembros inferiores, junto con segmentos sacros.',
    clinical:'Una radiculopatía lumbar afecta una raíz; debe distinguirse de una lesión de la médula o de múltiples raíces de la cola de caballo.',
    sources:['external','roots'] },
  { id:'sacral', name:'Sacra', range:'S1–S5', count:5, prefix:'S', color:'#578da0', start:383, end:426,
    anatomy:'Cinco segmentos medulares y cinco pares de nervios sacros. La médula sacra está dentro del canal vertebral, por encima del sacro óseo.',
    connectivity:'Las raíces sacras descienden en la cola de caballo. S2–S4 participan en conexiones somáticas y parasimpáticas pélvicas.',
    function:'Contribuye a funciones del miembro inferior, sensibilidad perineal y control de vejiga, intestino y función sexual.',
    clinical:'La alteración de estas conexiones puede afectar sensibilidad perineal y control de esfínteres. El patrón depende de las estructuras y raíces involucradas.',
    sources:['external','roots','pelvic'] },
  { id:'coccygeal', name:'Coccígea', range:'Co1', count:1, prefix:'Co', color:'#ae6f79', start:426, end:439,
    anatomy:'Un segmento medular coccígeo y un par de nervios coccígeos. No equivale a contar las piezas óseas del cóccix.',
    connectivity:'El nervio Co1 se conecta con la región coccígea y participa en el plexo coccígeo.',
    function:'Contribuye a la sensibilidad de una pequeña región cercana al cóccix.',
    clinical:'La distribución sensitiva puede variar y solaparse con la de nervios vecinos. El esquema no es un mapa de dermatomas.',
    sources:['external','roots','coccygeal'] }
];

export const coverings = [
  { id:'dura', name:'Duramadre', color:'#788ca1', kind:'Meninge externa',
    anatomy:'Cubierta resistente que forma el saco dural. En la columna está separada del hueso por el espacio epidural.',
    connectivity:'Envuelve las cubiertas internas y se prolonga en mangas alrededor de las raíces.',
    function:'Aporta protección mecánica al contenido del saco dural.',
    clinical:'El espacio epidural está por fuera de la duramadre; no es el espacio subaracnoideo.', sources:['coverings','circulation'] },
  { id:'arachnoid', name:'Aracnoides', color:'#76a99c', kind:'Meninge intermedia',
    anatomy:'Membrana situada por dentro de la duramadre y por fuera del espacio subaracnoideo.',
    connectivity:'Las trabéculas aracnoideas la relacionan con la piamadre.',
    function:'Delimita externamente el espacio que contiene LCR alrededor de la médula.',
    clinical:'El espacio subdural es potencial; no se muestra como una cavidad normal llena de LCR.', sources:['coverings','circulation'] },
  { id:'csf', name:'Espacio subaracnoideo', color:'#9dcbd4', kind:'Espacio con LCR',
    anatomy:'Espacio real entre aracnoides y piamadre, con líquido cefalorraquídeo (LCR).',
    connectivity:'Se continúa alrededor de la médula y por debajo del cono, rodeando las raíces de la cola de caballo.',
    function:'El LCR contribuye a amortiguar y sostener el sistema nervioso central.',
    clinical:'La cisterna lumbar contiene LCR y raíces por debajo del cono medular. No es el conducto central de la médula.', sources:['coverings','circulation'] },
  { id:'pia', name:'Piamadre', color:'#bd816c', kind:'Meninge interna',
    anatomy:'Membrana fina adherida a la superficie de la médula y a sus contornos.',
    connectivity:'Sus prolongaciones incluyen los ligamentos dentados y el componente pial del filum terminale.',
    function:'Participa en el sostén y la fijación de la médula dentro de sus cubiertas.',
    clinical:'Su contacto con la médula la distingue de las dos cubiertas externas.', sources:['coverings'] },
  { id:'dorsalroot', name:'Raíz dorsal', color:'#bc9b59', kind:'Entrada sensitiva',
    anatomy:'Los filamentos posteriores se reúnen en una raíz dorsal. Su ganglio contiene somas de neuronas sensitivas.',
    connectivity:'Lleva información desde la periferia hacia circuitos de la médula.',
    function:'Conduce aferencias sensitivas; sus axones entran por la región posterolateral.',
    clinical:'Una lesión de una raíz dorsal puede alterar la sensibilidad de su territorio, con solapamiento entre raíces vecinas.', sources:['roots','internal'] },
  { id:'dorsalganglion', name:'Ganglio de la raíz dorsal', color:'#bc9b59', kind:'Somas sensitivos',
    anatomy:'Engrosamiento de la raíz dorsal que reúne los cuerpos celulares de neuronas sensitivas primarias.',
    connectivity:'Las prolongaciones de estas neuronas conectan la periferia con la médula.',
    function:'Aloja somas sensitivos. No es un relevo sináptico equivalente a los ganglios autónomos.',
    clinical:'Está en la raíz dorsal; la raíz ventral no tiene un ganglio equivalente.', sources:['roots'] },
  { id:'ventralroot', name:'Raíz ventral', color:'#c87765', kind:'Salida motora',
    anatomy:'Los filamentos anteriores se reúnen en una raíz ventral, sin ganglio sensitivo.',
    connectivity:'Conduce axones de motoneuronas y, en los niveles correspondientes, fibras autónomas preganglionares.',
    function:'Lleva salida motora desde la médula hacia la periferia.',
    clinical:'Su lesión puede causar debilidad y alteraciones de reflejos en los músculos relacionados.', sources:['roots','internal'] },
  { id:'spinalnerve', name:'Nervio espinal', color:'#888057', kind:'Nervio mixto',
    anatomy:'Se forma cuando se unen las raíces dorsal y ventral, fuera del tejido medular.',
    connectivity:'Se divide en ramos posterior y anterior. Ambos contienen fibras sensitivas y motoras.',
    function:'Comunica el sistema nervioso central con estructuras periféricas mediante axones de distintas funciones.',
    clinical:'Raíz, nervio espinal y ramo son estructuras diferentes. Un ramo posterior no es una raíz dorsal.', sources:['roots'] }
];

/** Salidas aproximadas para comparar longitud de raíces, sin alinear segmentos y huesos. */
export function buildSpinalSegments() {
  return regions.flatMap(region => Array.from({length:region.count}, (_,index) => ({
    region:region.id, label:`${region.prefix}${index+1}`, color:region.color,
    origin:region.start+(index+.5)*(region.end-region.start)/region.count,
    exit:region.id==='cervical'?56+index*18:region.id==='thoracic'?210+index*20:region.id==='lumbar'?460+index*31:region.id==='sacral'?606+index*18:714
  })));
}
