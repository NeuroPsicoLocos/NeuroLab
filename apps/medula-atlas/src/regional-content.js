// Coordenadas calibradas al raster seleccionado, viewBox 600x480; no medidas de tejido.
const r=(id,name,x,y,where,fn,shape='')=>({id,name,x,y,where,fn,shape});
export const categories={
 surface:{name:'Surcos y fisura',note:'Accidentes de superficie. La fisura mediana anterior es profunda; el surco anterolateral está poco definido.',items:[
 r('s1','Surco mediano posterior',300,65,'Línea media posterior, arriba.','Orienta la división posterior de la médula.'),
 r('s2','Surco intermedio posterior',349,79,'Entre la línea media y la entrada posterior; se señala el lado derecho de la imagen.','Referencia de separación de fascículos grácil y cuneiforme en niveles altos.'),
 r('s3','Surco posterolateral',465,130,'Superficie dorsolateral; entrada de raicillas posteriores.','Referencia de entrada de aferencias sensitivas.'),
 r('s4','Fisura mediana anterior',300,320,'Hendidura profunda inferior, en la línea media.','Separa parcialmente los cordones anteriores; aloja vasos en la anatomía real.'),
 r('s5','Surco anterolateral',478,326,'Zona ventrolateral de salida radicular; límite poco definido.','Referencia de salida de las raicillas anteriores.') ]},
 regions:{name:'Astas y región intermedia',note:'Se identifica el lado derecho de la imagen. Estas regiones amplias no son núcleos ni láminas individuales.',items:[
 r('posterior','Asta posterior',374,175,'Prolongación estrecha posterior de sustancia gris.','Procesa información sensitiva y participa en circuitos locales.','M394 122Q400 129 385 160L366 203L353 222Q351 203 364 177L382 134Z'),
 r('intermediate','Región intermedia',348,235,'Sustancia gris entre las astas; en C6 no se dibuja un asta lateral torácica.','Integra circuitos medulares. Su composición cambia por nivel.','M320 225Q350 218 367 233L358 252L321 250Z'),
 r('anterior','Asta anterior',385,303,'Porción anterior ancha de la sustancia gris.','Aloja circuitos motores y grupos de motoneuronas somáticas.','M360 260Q407 258 426 296Q430 330 397 332Q366 326 355 300Z') ]},
 micro:{name:'Tracto y cavidad',note:'Referencias topográficas, no estructuras delimitadas por la textura. Las motoneuronas no se representan como células visibles a esta escala.',items:[
 r('lissauer','Tracto dorsolateral de Lissauer',405,110,'Sustancia blanca junto al extremo del asta posterior.','Transporta ramas de aferentes finos a segmentos próximos; no es una lámina de sustancia gris.'),
 r('gelatinosa','Sustancia gelatinosa',385,140,'Zona superficial del asta posterior, bajo la región marginal.','Región asociada principalmente a la lámina II; interviene en procesamiento sensitivo.'),
 r('motor','Grupos de motoneuronas',395,310,'Grupos discontinuos dentro del asta anterior.','Salida motora somática. Asociados con IX, no equivalen al asta anterior completa.'),
 r('canal','Conducto central',300,237,'Pequeña cavidad en el centro de la comisura gris.','Luz ependimaria, de permeabilidad variable en el adulto. No es la lámina X; X es tejido alrededor.') ]},
 laminae:{name:'Rexed I–X · esquema',note:'Localización aproximada y unilateral. No son líneas visibles en el corte: las láminas se definen por citoarquitectura. Sin segmentación ni áreas medidas.',items:[
 r('I','I · Región marginal',391,125,'Extremo superficial del asta posterior.','Procesamiento de entradas sensitivas; referencia aproximada.'),
 r('II','II · Sustancia gelatinosa',385,140,'Bajo I, en el asta posterior.','Circuitos locales de modulación sensitiva.'),
 r('III','III · Asta posterior superficial',379,157,'Más profunda que II.','Integración somatosensitiva local.'),
 r('IV','IV · Cabeza del asta posterior',372,177,'Profundidad de la cabeza posterior.','Incluye parte de la región del núcleo propio; no son conceptos idénticos.'),
 r('V','V · Cuello del asta posterior',362,198,'Cuello del asta posterior.','Convergencia de señales sensitivas y descendentes.'),
 r('VI','VI · Base del asta posterior',353,217,'Base posterior; más desarrollada en engrosamientos.','Integración sensoriomotora.'),
 r('VII','VII · Zona intermedia',343,236,'Sustancia gris intermedia.','Circuitos heterogéneos, con poblaciones que varían por segmento.'),
 r('VIII','VIII · Región anterior medial',334,278,'Porción medial del asta anterior, esquemática.','Participa en circuitos motores medulares.'),
 r('IX','IX · Grupos motores',391,309,'Grupos discontinuos del asta anterior.','Motoneuronas somáticas; no se presenta como una banda continua.'),
 r('X','X · Región pericanalicular',312,237,'Tejido gris alrededor del conducto.','Integración local y conexiones comisurales; no es la cavidad central.') ]}
};

const micro=categories.micro.items;
categories.nuclei={name:'Núcleos y grupos celulares · esquema',note:'C6 idealizado: regiones nucleares y grupos celulares aproximados. Sin asta lateral torácica, núcleo de Clarke ni mapas musculares inventados.',items:[micro.find(x=>x.id==='gelatinosa'),{id:'proprius',name:'Región del núcleo propio',x:376,y:169,where:'Cabeza del asta posterior, relacionada con III–IV; sus contornos no son equivalentes exactos.',fn:'Procesamiento somatosensitivo. Área orientativa, de límite poco definido.'},micro.find(x=>x.id==='motor')]};
categories.micro.items=micro.filter(x=>['lissauer','canal'].includes(x.id));
categories.micro.note='Lissauer es sustancia blanca; el conducto es una cavidad. Ninguno es una lámina de sustancia gris.';
categories.laminae.note='Áreas citoarquitectónicas ESQUEMÁTICAS. Los contornos superpuestos no son líneas macroscópicas del tejido. VII y VIII se idealizan; IX son grupos discontinuos y X excluye la cavidad central.';

categories.regions.note='Divisiones macroscópicas idealizadas en ambos lados. Los marcadores y la leyenda identifican la misma región bilateral; no equivalen a núcleos o láminas individuales.';
