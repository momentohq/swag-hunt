const slackWebhookUrl = 'https://hooks.slack.com/triggers/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';

exports.handler = async (state) => {
  try {
    const message = `Top Viewed:
${getNumberedStringFromArray(state.views)}

Top Searched:
${getNumberedStringFromArray(state.search)}

Top Upvotes:
${getNumberedStringFromArray(state.upvotes)}

Upload Stats:
${getUploadStats(state.uploads)}`;

    await fetch(slackWebhookUrl, {
      method: 'POST',
      body: JSON.stringify({ message })
    });

    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false };
  }
};

const getNumberedStringFromArray = (array) => {
  const message = array.map((value, index) => {
    return `${index + 1}. ${value.name} - ${value.value}`
  }).join('\r\n');

  return message;
}

const getUploadStats = (uploads) => {
  const imageUploads = uploads.find(u => u.name == 'imageUploads');
  const submitted = uploads.find(u => u.name == 'successful');
  const types = uploads.filter(u => !['imageUploads', 'successful', 'inappropriate', 'swagNotFound']);
  return `Number of new swag items added: ${submitted?.value ?? 'unknown'}
  Number of images uploaded: ${imageUploads?.value ?? 'unknown'}
  Top swag types:
  ${getNumberedStringFromArray(types)}
  `;
}
