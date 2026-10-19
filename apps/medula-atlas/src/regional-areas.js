// Superposiciones docentes calibradas al raster C6. No segmentación histológica.
export const grayRight='M300 218C326 220 332 207 345 181C358 159 376 130 386 119Q397 112 399 119C399 131 384 160 376 178C365 201 369 217 386 230C406 244 430 264 432 292C434 314 421 331 400 333C372 333 353 317 342 291C333 269 327 257 313 256L300 256Z';
export const mirror=d=>{let i=0;return d.replace(/-?\d+(?:\.\d+)?/g,n=>String(i++%2===0?600-Number(n):Number(n)));};
const ellipse=(x,y,rx,ry)=>`M${x-rx} ${y}a${rx} ${ry} 0 1 0 ${rx*2} 0a${rx} ${ry} 0 1 0 ${-rx*2} 0Z`;
const box=(x,y,w,h)=>`M${x} ${y}h${w}v${h}h${-w}Z`;
const pair=d=>d+mirror(d);
const motorRight=ellipse(398,304,11,13)+ellipse(420,290,7,9)+ellipse(383,320,7,9);
// Reflect only absolute control-point paths; ellipses reflected by explicit centres.
export const motor=motorRight+ellipse(202,304,11,13)+ellipse(180,290,7,9)+ellipse(217,320,7,9);
const viii=pair('M316 260Q341 260 354 289Q359 315 374 330L343 330Q322 310 316 285Z');
const xDisk=ellipse(300,237,18,14),canal=ellipse(300,237,4,4);
export const grayClip=grayRight+mirror(grayRight)+canal;
export const areas={
 regions:{posterior:box(150,108,300,107),intermediate:box(150,215,300,45),anterior:box(150,260,300,90)},
 laminae:{I:box(150,110,300,20),II:box(150,130,300,17),III:box(150,147,300,20),IV:box(150,167,300,23),V:box(150,190,300,20),VI:box(330,210,110,13)+box(160,210,110,13),VII:box(150,210,300,143)+box(330,210,110,13)+box(160,210,110,13)+viii+motor+xDisk,VIII:viii,IX:motor,X:xDisk+canal},
 micro:{lissauer:'M396 103Q409 102 420 113L409 123L399 119Z',canal},
 nuclei:{gelatinosa:box(150,130,300,17),proprius:box(150,147,300,43),motor}
};
// Gray matter clip applies to every laminar/regional/nuclear area. Lissauer is outside it.
