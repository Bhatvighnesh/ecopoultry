// Simulator readings use a "demo-" node ID prefix so they can be separated from real hardware.
const DEMO_NODE = /^demo-/;

function sourceOf(nodeId) {
  return DEMO_NODE.test(nodeId || '') ? 'demo' : 'live';
}

function nodeIdFilter(source) {
  return { nodeId: source === 'demo' ? DEMO_NODE : { $not: DEMO_NODE } };
}

module.exports = { sourceOf, nodeIdFilter };
