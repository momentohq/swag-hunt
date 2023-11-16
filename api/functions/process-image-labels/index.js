exports.handler = async (state) => {
  const labels = state.labels.map(label => {
    return `\t- name: ${label.Name}, categories: ${label.Categories.map(c => c.Name).join('/')}, confidence: ${label.Confidence}`;
  });

  const tags = state.labels.filter(l => l.Confidence >= 80).map(l => l.Name).join(',');
  return { labels, tags };
};
