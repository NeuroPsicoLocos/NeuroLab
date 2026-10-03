/** Geometría SVG docente independiente de las descripciones científicas.
 * Lienzo 600 × 480, posterior arriba. No hay escala física ni áreas medidas.
 * Las dos mitades se dibujan por reflexión en x=300.
 */
export const grayGeometry = {
  c6: {
    posteriorTop: 78,
    outer: 'M300 78C347 61 410 90 458 128C533 183 535 291 453 364C409 404 356 417 320 400Q306 391 304 346L300 283L296 346Q294 391 280 400C244 417 191 404 147 364C65 291 67 183 142 128C190 90 253 61 300 78Z',
    gray: 'M300 235C322 242 334 230 344 200L377 140Q386 124 399 128Q402 134 393 147C380 173 378 198 366 219Q367 240 387 253C407 267 430 278 430 306C430 343 403 357 373 347C350 339 343 330 333 308Q325 280 313 272L300 272Z',
    bands: [127, 138, 153, 169, 189, 218, 235],
    motor: [[388, 310, 13, 18], [410, 301, 9, 12], [374, 327, 7, 10]],
    medial: 'M300 273Q321 272 333 307Q338 328 356 342L336 344Q314 328 310 306Z',
    dorsalBounds: [335, 117, 76, 127], ventralBounds: [321, 260, 122, 100]
  },
  t3: {
    posteriorTop: 76,
    outer: 'M300 76C341 66 402 92 438 137C494 194 493 293 432 354C398 393 348 410 317 394Q306 384 304 340L300 283L296 340Q294 384 283 394C252 410 202 393 168 354C107 293 106 194 162 137C198 92 259 66 300 76Z',
    gray: 'M300 239C313 240 325 225 332 202L353 129Q358 115 367 121Q373 125 366 139C358 166 356 197 347 219L382 227Q397 237 382 246L351 248C359 266 379 277 379 297Q377 320 355 325C340 328 328 307 325 290L316 269L300 269Z',
    bands: [120, 131, 147, 167, 194, 231, 239],
    motor: [[354, 302, 10, 13], [367, 292, 7, 9]],
    medial: 'M300 270Q319 270 325 291Q330 309 345 323L330 323Q313 306 309 290Z',
    dorsalBounds: [324, 108, 56, 131], ventralBounds: [316, 257, 74, 79]
  },
  l4: {
    posteriorTop: 80,
    outer: 'M300 80C345 66 413 95 457 137C518 193 523 299 453 366C410 406 355 418 320 401Q306 392 304 346L300 283L296 346Q294 392 280 401C245 418 190 406 147 366C77 299 82 193 143 137C187 95 255 66 300 80Z',
    gray: 'M300 235C321 240 339 222 352 196L375 143Q383 124 402 130Q412 138 400 154C389 171 386 197 374 219Q373 239 395 253C417 267 443 277 443 306Q443 347 411 358C380 366 351 347 337 316Q325 282 313 272L300 272Z',
    bands: [129, 142, 158, 176, 196, 216, 235],
    motor: [[397, 311, 16, 19], [420, 295, 11, 14], [383, 332, 10, 12]],
    medial: 'M300 273Q323 271 337 314Q347 338 367 355L343 354Q316 332 311 307Z',
    dorsalBounds: [339, 117, 84, 125], ventralBounds: [321, 257, 136, 112]
  },
  s3: {
    posteriorTop: 91,
    outer: 'M300 91C343 81 389 103 421 142C469 196 471 286 421 345C388 385 346 401 316 388Q306 379 304 340L300 283L296 340Q294 379 284 388C254 401 212 385 179 345C129 286 131 196 179 142C211 103 257 81 300 91Z',
    gray: 'M300 235C312 238 328 219 337 191L350 137Q356 121 369 126Q381 135 372 151C360 174 361 198 353 219Q355 240 374 253C401 263 414 280 414 307Q417 340 390 349C362 354 340 335 329 309Q320 279 314 269L300 269Z',
    bands: [125, 136, 152, 172, 194, 216, 235],
    motor: [[374, 313, 14, 18], [396, 294, 10, 12], [359, 327, 8, 10]],
    medial: 'M300 270Q320 269 329 308Q337 330 353 343L334 339Q313 319 310 301Z',
    dorsalBounds: [325, 113, 63, 127], ventralBounds: [317, 254, 110, 106]
  }
};

const ellipse = (x, y, rx, ry) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`;
const box = ([x, y, width, height]) => `<rect x="${x}" y="${y}" width="${width}" height="${height}"/>`;

/** Todos los territorios quedan recortados a la sustancia gris; IX es discontinua. */
export function grayTerritory(levelId, id, mode) {
  const geometry = grayGeometry[levelId];
  const bands = geometry.bands;
  if (mode === 'laminae') {
    const index = ['I', 'II', 'III', 'IV', 'V', 'VI'].indexOf(id);
    if (index >= 0) return { markup: box([300, bands[index], 190, bands[index + 1] - bands[index]]), bounds: [geometry.dorsalBounds[0] - 8, bands[index] - 6, geometry.dorsalBounds[2] + 16, bands[index + 1] - bands[index] + 12] };
    if (id === 'VII') return { markup: box([300, bands[6], 190, 150]), bounds: [302, 221, geometry.ventralBounds[0] + geometry.ventralBounds[2] - 295, 143] };
    if (id === 'VIII') return { markup: `<path d="${geometry.medial}"/>`, bounds: [299, 261, 72, 103] };
    if (id === 'IX') return { markup: geometry.motor.map(values => ellipse(...values)).join(''), bounds: geometry.ventralBounds };
    if (id === 'X') return { markup: ellipse(300, 254, 27, 16), bounds: [267, 231, 66, 46], midline: true };
  }
  const territory = {
    dorsal: { markup: box([300, 100, 170, 135]), bounds: geometry.dorsalBounds },
    ventral: { markup: box([300, 270, 190, 110]), bounds: geometry.ventralBounds },
    intermediate: { markup: box([300, 216, 190, 54]), bounds: [301, 206, 103, 73] },
    commissure: { markup: ellipse(300, 254, 27, 17), bounds: [266, 230, 68, 48], midline: true },
    canal: { markup: ellipse(300, 254, 6, 6), bounds: [270, 224, 60, 60], midline: true },
    gelatinosa: { markup: box([300, bands[1], 190, bands[2] - bands[1]]), bounds: [geometry.dorsalBounds[0] - 8, bands[1] - 8, geometry.dorsalBounds[2] + 16, bands[2] - bands[1] + 16] },
    clarke: { markup: ellipse(336, 235, 8, 9), bounds: [315, 214, 42, 42] },
    motor: { markup: geometry.motor.map(values => ellipse(...values)).join(''), bounds: geometry.ventralBounds },
    lateral: { markup: ellipse(380, 237, 13, 9), bounds: [356, 213, 48, 48] },
    'sacral-autonomic': { markup: ellipse(349, 250, 8, 9), bounds: [328, 229, 42, 42] }
  };
  return territory[id];
}

/** Conserva el aspecto del lienzo al enfocar; limita el aumento a 4×. */
export function grayFocusViewBox(bounds, side = 'left', midline = false) {
  let [x, y, width, height] = bounds;
  if (side === 'right' && !midline) x = 600 - x - width;
  const centerX = x + width / 2, centerY = y + height / 2;
  const viewWidth = Math.min(600, Math.max(150, width * 1.6, height * 1.6 * 1.25));
  const viewHeight = viewWidth / 1.25;
  return [Math.max(0, Math.min(600 - viewWidth, centerX - viewWidth / 2)), Math.max(0, Math.min(480 - viewHeight, centerY - viewHeight / 2)), viewWidth, viewHeight];
}

export function grayBaseMarkup(levelId, prefix) {
  const geometry = grayGeometry[levelId];
  return `<defs>
    <radialGradient id="${prefix}-white" cx="43%" cy="34%" r="72%"><stop stop-color="#fff9e9"/><stop offset=".75" stop-color="#eee0c7"/><stop offset="1" stop-color="#d9c9ab"/></radialGradient>
    <linearGradient id="${prefix}-gray" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#d7b4a5"/><stop offset="1" stop-color="#b88d7e"/></linearGradient>
    <filter id="${prefix}-shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="7" stdDeviation="7" flood-color="#594c37" flood-opacity=".13"/></filter>
    <clipPath id="${prefix}-gray-clip"><path d="${geometry.gray}"/><path d="${geometry.gray}" transform="translate(600 0) scale(-1 1)"/></clipPath>
  </defs>
  <path d="${geometry.outer}" fill="url(#${prefix}-white)" stroke="#c6b89c" stroke-width="2" filter="url(#${prefix}-shadow)"/>
  <path d="${geometry.gray}" fill="url(#${prefix}-gray)" stroke="#b99385" stroke-width="1.6"/>
  <path d="${geometry.gray}" transform="translate(600 0) scale(-1 1)" fill="url(#${prefix}-gray)" stroke="#b99385" stroke-width="1.6"/>
  <rect x="297" y="235" width="6" height="37" fill="url(#${prefix}-gray)" clip-path="url(#${prefix}-gray-clip)"/>
  <path d="M300 ${geometry.posteriorTop}V231" fill="none" stroke="#c4b699" stroke-width="1.3"/>
  <circle cx="300" cy="254" r="5" fill="#fffefa" stroke="#8b877a" stroke-width="1.5"/>`;
}
