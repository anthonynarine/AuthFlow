import DOMPurify from 'dompurify';
import lock from '../../package-lock.json';

describe('diagram HTML sanitization boundary', () => {
  test('uses the reviewed patched sanitizer in both runtime and lock', () => {
    expect(DOMPurify.version).toBe('3.4.17');
    expect(lock.packages['node_modules/dompurify'].version).toBe('3.4.17');
  });

  test('preserves ordinary formatted text', () => {
    expect(DOMPurify.sanitize('<strong>Diagram description</strong>')).toBe(
      '<strong>Diagram description</strong>'
    );
  });

  test('removes executable elements and event handlers', () => {
    const clean = DOMPurify.sanitize(
      '<p onclick="alert(1)">Description</p><script>alert(1)</script>'
    );
    const element = document.createElement('div');
    element.innerHTML = clean;
    expect(element.textContent).toBe('Description');
    expect(element.querySelector('script')).toBeNull();
    expect(element.querySelector('p').hasAttribute('onclick')).toBe(false);
  });

  test('rejects script URL destinations while retaining safe links', () => {
    const element = document.createElement('div');
    element.innerHTML = DOMPurify.sanitize(
      '<a href="javascript:alert(1)">Unsafe</a><a href="https://example.test/">Safe</a>'
    );
    const links = element.querySelectorAll('a');
    expect(links[0].hasAttribute('href')).toBe(false);
    expect(links[1].getAttribute('href')).toBe('https://example.test/');
  });
});
