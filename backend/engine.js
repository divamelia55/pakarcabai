function forwardChain(facts, rules) {
  const factSet = new Set(facts);
  const applied = new Set();
  const inferences = [];
  let addedNew = true;

  while (addedNew) {
    addedNew = false;

    const applicable = rules.filter(r => !applied.has(r.id) && r.if.every(p => factSet.has(p)));
    if (applicable.length === 0) break;

    applicable.sort((a, b) => {
      if ((b.priority || 0) !== (a.priority || 0)) return (b.priority || 0) - (a.priority || 0);
      return b.if.length - a.if.length;
    });

    const rule = applicable[0];
    applied.add(rule.id);
    inferences.push({ ruleId: rule.id, disease: rule.then.disease, cf: rule.then.cf, description: rule.description });
    addedNew = true;
  }

  return inferences;
}

module.exports = { forwardChain };