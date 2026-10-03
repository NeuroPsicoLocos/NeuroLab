import * as THREE from 'three';

/** Tejidos esquemáticos sobre la línea medular. Solo el hueso proviene del atlas. */
export function createSpinalCoverings(scene, cordPath, models, pickables) {
  const groups={};
  const materials={};
  const colors={pia:0xbd816c,arachnoid:0x76a99c,dura:0x788ca1,csf:0x9dcbd4,dorsalroot:0xd7b778,dorsalganglion:0xd7b778,ventralroot:0xcf8872,spinalnerve:0xc6b58a};
  for(const id of ['pia','arachnoid','dura','csf','nerves']) { groups[id]=new THREE.Group();scene.add(groups[id]); }
  function material(id,opacity=1) {
    if(!materials[id]) materials[id]=new THREE.MeshStandardMaterial({color:colors[id],roughness:.7,transparent:opacity<1,opacity,depthWrite:opacity>=1,side:THREE.DoubleSide});
    return materials[id];
  }
  function add(group,geometry,id,opacity=1) {
    const mesh=new THREE.Mesh(geometry,material(id,opacity));
    mesh.userData.structure=id;group.add(mesh);pickables.push(mesh);return mesh;
  }
  // Aperturas y extremos escalonados permiten ver el orden de las cubiertas.
  // No representan desgarros, disección real ni espesores medidos.
  function sleeve(id,radius,start,end,opening,opacity) {
    const points=Array.from({length:65},(_,i)=>cordPath.getPoint(start+(end-start)*i/64));
    const path=new THREE.CatmullRomCurve3(points);
    const geometry=new THREE.TubeGeometry(path,64,radius,40,false);
    if(opening) {
      const indices=[];
      for(let i=0;i<64;i++) for(let j=opening;j<40;j++) {
        const a=i*41+j,b=(i+1)*41+j,c=b+1,d=a+1;
        indices.push(a,b,d,b,c,d);
      }
      geometry.setIndex(indices);
    }
    add(groups[id],geometry,id,opacity);
    if(opening) {
      // Bordes suaves del corte, extraídos de la misma superficie.
      const positions=geometry.getAttribute('position');
      for(const j of [opening,40]) {
        const edge=Array.from({length:65},(_,i)=>new THREE.Vector3().fromBufferAttribute(positions,i*41+j));
        add(groups[id],new THREE.TubeGeometry(new THREE.CatmullRomCurve3(edge),64,.008,6,false),id,opacity);
      }
    }
  }
  sleeve('pia',.307,.03,.98,0,.28);
  sleeve('csf',.368,.08,.97,12,.08);
  sleeve('arachnoid',.432,.13,.96,12,.38);
  sleeve('dura',.478,.23,.96,15,.68);

  function tube(points,radius,id) {
    return add(groups.nerves,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),24,radius,8,false),id);
  }
  function cordAtY(y) {
    let best=cordPath.getPoint(0),distance=Infinity;
    for(let i=0;i<=160;i++) {const point=cordPath.getPoint(i/160),d=Math.abs(point.y-y);if(d<distance){best=point;distance=d;}}
    return best;
  }
  // Dos salidas bilaterales entre las tres vértebras. No se les asigna un
  // segmento medular: la posición de sus filamentos y ganglios es aproximada.
  for(let level=0;level<models.length-1;level++) {
    const y=(models[level].foramenCenter[1]+models[level+1].foramenCenter[1])/2;
    const base=cordAtY(y),z=base.z;
    for(const side of [-1,1]) {
      const dorsal=new THREE.Vector3(side*.97,y+.05,z-.13);
      const ventral=new THREE.Vector3(side*.99,y-.12,z+.14);
      const ganglion=new THREE.Vector3(side*1.33,y-.06,z-.06);
      const junction=new THREE.Vector3(side*1.68,y-.19,z+.12);
      for(let filament=0;filament<4;filament++) {
        const origin=cordAtY(y+.25+filament*.13);
        const dorsalStart=origin.clone().add(new THREE.Vector3(side*.19,0,-.22));
        const ventralStart=origin.clone().add(new THREE.Vector3(side*.20,-.04,.20));
        tube([dorsalStart,new THREE.Vector3(side*.52,origin.y-.15,z-.26),dorsal],.013,'dorsalroot');
        tube([ventralStart,new THREE.Vector3(side*.55,origin.y-.21,z+.23),ventral],.013,'ventralroot');
      }
      tube([dorsal,ganglion,junction],.052,'dorsalroot');
      tube([ventral,new THREE.Vector3(side*1.34,y-.23,z+.24),junction],.045,'ventralroot');
      const swelling=add(groups.nerves,new THREE.SphereGeometry(1,20,12),'dorsalganglion');
      swelling.position.copy(ganglion);swelling.scale.set(.20,.10,.12);
      const branchPoint=new THREE.Vector3(side*2.13,y-.25,z+.18);
      tube([junction,branchPoint],.067,'spinalnerve');
      tube([branchPoint,new THREE.Vector3(side*2.42,y-.16,z-.09),new THREE.Vector3(side*2.58,y+.03,z-.39)],.038,'spinalnerve');
      tube([branchPoint,new THREE.Vector3(side*2.47,y-.37,z+.38),new THREE.Vector3(side*2.86,y-.44,z+.55)],.051,'spinalnerve');
    }
  }
  return {
    layer(id,visible) {if(groups[id])groups[id].visible=visible;},
    select(id) {
      for(const [key,value] of Object.entries(materials)) {
        const selected=key===id;
        value.emissive.set(selected?colors[key]:0x000000);
        value.emissiveIntensity = selected ? .32 : 0;
      }
    }
  };
}
