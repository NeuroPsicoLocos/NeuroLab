/** Descripciones de las láminas, independientes de la galería y del mapa. */
export const illustrations = [
  {
    id: 'tracts', title: 'Vías de la sustancia blanca',
    subtitle: 'Corte transversal', image: '01-vias-v2.png',
    alt: 'Ilustración de un corte medular con sustancia gris coral, sustancia blanca marfil y territorios orientativos en verde y ocre.',
    caption: 'La sustancia blanca rodea la mariposa de sustancia gris. Sus fibras forman vías que conectan segmentos medulares con el encéfalo.',
    notes: [
      ['Cordones posteriores', 'Los fascículos grácil y cuneiforme ocupan la región posterior de la médula torácica alta.'],
      ['Vías laterales y anteriores', 'En estas regiones se distribuyen vías sensitivas y motoras. Los territorios reales pueden solaparse.'],
      ['Del dibujo a la función', 'Abre el mapa interactivo para seleccionar una vía y consultar su recorrido y lugar de cruce.']
    ], sources: ['columns', 'morphology']
  },
  {
    id: 'longitudinal', title: 'Continuidad longitudinal',
    subtitle: 'De un segmento al siguiente', image: '02-recorrido-v2.png',
    alt: 'Cuatro cortes medulares superpuestos enlazados por cintas ascendentes en verde y turquesa.',
    caption: 'Los cortes permiten comparar formas y relacionarlas con la continuidad de las vías. Las cintas y las flechas representan un ascenso conceptual.',
    notes: [
      ['Una médula, varios niveles', 'La forma y la proporción entre sustancia gris y blanca cambian a lo largo de la médula.'],
      ['Ensanchamientos', 'La organización de los circuitos que inervan las extremidades se relaciona con los ensanchamientos cervical y lumbosacro.'],
      ['Cómo leer las flechas', 'Indican ascenso. La lámina no reconstruye decusaciones, trayectorias axonales ni dimensiones exactas.']
    ], sources: ['internal', 'cerebellar']
  },
  {
    id: 'gray', title: 'Sustancia gris y raíces',
    subtitle: 'Organización del corte', image: '03-sustancia-gris-v2.png',
    alt: 'Corte transversal con astas posteriores estrechas, astas anteriores más anchas, conducto central y filamentos de las raíces.',
    caption: 'El contorno central reúne astas posteriores, región intermedia y astas anteriores. Los filamentos ilustran la entrada y salida de las raíces.',
    notes: [
      ['Asta posterior', 'Incluye la zona marginal, la sustancia gelatinosa y el núcleo propio. Participa en el procesamiento sensitivo.'],
      ['Región intermedia', 'Aloja circuitos integradores. El núcleo dorsal de Clarke origina la vía espinocerebelosa posterior.'],
      ['Asta anterior', 'Contiene grupos de motoneuronas cuyos axones contribuyen a las raíces ventrales.'],
      ['Láminas de Rexed', 'Son una clasificación histológica. Las bandas de esta ilustración son orientativas y no delinean con exactitud las láminas I a X.']
    ], sources: ['internal', 'dorsal']
  },
  {
    id: 'vertebral', title: 'Canal vertebral y meninges',
    subtitle: 'Relaciones de protección', image: '04-canal-controlado.svg',
    alt: 'Dos vistas separadas: médula continua en el canal vertebral en vista sagital; corte transversal con dorsal arriba, ventral abajo, meninges y raíces con ganglio sólo dorsal.',
    caption: 'Esquema vectorial para revisión: A muestra continuidad craneocaudal; B es un corte transversal independiente. No asigna equivalencias entre segmentos medulares y niveles vertebrales.',
    notes: [
      ['Canal vertebral', 'El cuerpo y el arco vertebral delimitan el foramen. La continuidad de los forámenes forma el canal vertebral.'],
      ['Cubiertas', 'Desde la médula hacia fuera: piamadre, espacio subaracnoideo, aracnoides y duramadre.'],
      ['Raíces y nervio', 'La raíz dorsal se asocia con un ganglio sensitivo. Se une con la raíz ventral para formar un nervio espinal.'],
      ['Vistas separadas', 'En A las raíces se omiten; en B se omite el hueso y se representa un solo lado. El espacio epidural es externo a la dura; el subdural es potencial. Revisión anatómica experta pendiente.']
    ], sources: ['vertebra', 'meninges', 'spinalnerves', 'csf']
  }
];
