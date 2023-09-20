// (Markdown / Jira Markdown) <-> HTML
import  {defaultSchema}  from '@atlaskit/adf-schema/schema-default';
import { WikiMarkupTransformer } from '@atlaskit/editor-wikimarkup-transformer';
import { DOMParser, DOMSerializer } from 'prosemirror-model';

/**
 * Convert Jira "Wiki Markup" -> ProseMirror -> HTML
 * @param {string} md The Jira "Markdown" string
 * @returns {string} The generated HTML
 */
const toHTML = (md: string) => {
  // Convert the Wiki Markup from Jira to a ProseMirror node
  const transformer = new WikiMarkupTransformer(defaultSchema);
  const pmNode = transformer.parse(md);

  // Serialize Prose Mirror Node to a DocumentFragment
  const dom = DOMSerializer.fromSchema(defaultSchema).serializeFragment(pmNode);

  // Get the HTML
  const div = document.createElement('div');
  div.appendChild(dom);
  const html = div.innerHTML;

  return html;
};

export default toHTML;