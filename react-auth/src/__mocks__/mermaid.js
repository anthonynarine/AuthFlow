// Jest stand-in for mermaid (ESM-only, and needs a real layout engine).
// Plain functions, not jest.fn, because CRA's resetMocks would wipe their
// implementations; tests use jest.spyOn(mermaid, "render") to override.
const mermaid = {
    initialize() {},
    render(id) {
        return Promise.resolve({ svg: `<svg data-testid="mermaid-svg" id="${id}"></svg>` });
    },
};

module.exports = mermaid;
module.exports.default = mermaid;
