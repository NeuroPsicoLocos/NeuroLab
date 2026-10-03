import { projectInfo } from './project-info.js?v=5.1';
import { grayResources } from './gray-resources.js?v=5';

const escape = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[character]));
const link = (url, text) => `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(text)} ↗</a>`;

/** Páginas estáticas con datos editables; sin dependencias ni llamadas remotas. */
export function setupInfoPages() {
  document.querySelector('#gray-images').innerHTML = grayResources.images.map(item => {
    const image = `./assets/gray-matter/${item.image}`;
    return `<article class="gray-image-card panel"><div class="resource-heading"><span class="resource-kind">${escape(item.type)}</span><h2>${escape(item.title)}</h2><p class="resource-meta">${escape(item.metadata)}</p></div>
      <a class="gray-image-link" href="${image}" target="_blank" rel="noopener noreferrer" aria-label="Ampliar ${escape(item.title)}"><img src="${image}" alt="${escape(item.alt)}" loading="lazy"></a>
      <div class="resource-body"><p>${escape(item.caption)}</p><div class="resource-actions">${link(image, 'Ampliar imagen')}${link(item.source, 'Fuente y contexto')}</div><p class="resource-credit">${escape(item.credit)} · ${link(item.licenseURL, item.license)}. Sin modificaciones.</p></div></article>`;
  }).join('');
  document.querySelector('#gray-viewers').innerHTML = grayResources.viewers.map(item => `<article class="resource-card panel"><span class="resource-kind">${escape(item.type)}</span><h3>${escape(item.title)}</h3><p class="resource-meta">${escape(item.metadata)}</p><p>${escape(item.text)}</p>${link(item.url, item.action)}<p class="resource-credit">${escape(item.credit)}</p></article>`).join('');
  document.querySelector('#gray-check-date').textContent = `Fuentes comprobadas el ${grayResources.checked}. Los visores se abren en otra pestaña.`;

  document.querySelector('#about-introduction').textContent = projectInfo.introduction;
  document.querySelector('#about-purpose').textContent = projectInfo.purpose;
  document.querySelector('.about-tagline').textContent = projectInfo.tagline;
  document.querySelector('#about-portal').innerHTML = link(projectInfo.portal.url, projectInfo.portal.label);
  document.querySelector('#about-modules').innerHTML = projectInfo.modules.map(item => `<article class="resource-card panel"><span class="resource-kind">${escape(item.type)}</span><h3>${escape(item.title)}</h3><p class="resource-meta">${escape(item.metadata)}</p><p>${escape(item.text)}</p>${link(item.url, item.action)}</article>`).join('');
  document.querySelector('#about-related').textContent = projectInfo.related;
  document.querySelector('#about-principles').innerHTML = projectInfo.principles.map(([title, text], index) => `<article class="about-principle panel"><span class="step">0${index + 1}</span><h2>${escape(title)}</h2><p>${escape(text)}</p></article>`).join('');
  document.querySelector('#about-production').textContent = projectInfo.production;
  document.querySelector('#about-privacy').textContent = projectInfo.privacy;
  document.querySelector('#about-credits').innerHTML = projectInfo.credits.map(([title, author, url]) => `<div class="about-credit"><strong>${escape(title)}</strong>${link(url, author)}</div>`).join('');
  // No se inventan nombres, instituciones ni datos de contacto.
  const people = document.querySelector('#about-people');
  people.hidden = !projectInfo.people.length;
  people.innerHTML = projectInfo.people.map(person => `<article class="panel about-person"><h3>${escape(person.name)}</h3><p>${escape(person.role || '')}</p><p>${escape(person.institution || '')}</p></article>`).join('');
  const contact = document.querySelector('#about-contact');
  contact.hidden = !projectInfo.contact;
  if (projectInfo.contact) contact.innerHTML = `<span>Contacto: </span>${link(projectInfo.contact.url, projectInfo.contact.label)}`;
}
