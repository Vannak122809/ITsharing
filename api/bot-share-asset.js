export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).send('Missing id');
  }

  // Fetch data from Firestore via REST API
  const firestoreUrl = `https://firestore.googleapis.com/v1/projects/login-form-49609/databases/(default)/documents/assets/${id}`;
  
  try {
    const response = await fetch(firestoreUrl);
    const data = await response.json();

    if (data.error) {
      return res.status(404).send('Asset not found');
    }

    const title = data.fields?.title?.stringValue || 'ITShare Asset';
    const desc = data.fields?.description?.stringValue || 'Premium IT Resource on ITShare';
    
    // Fallbacks for image
    const img = data.fields?.coverImage?.stringValue || 
                data.fields?.gallery?.arrayValue?.values?.[0]?.stringValue || 
                data.fields?.url?.stringValue || 
                'https://itsharing.vercel.app/og-image.jpg';

    // The HTML returned to the crawler
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta property="og:type" content="website" />
        <meta property="og:title" content="${title.replace(/"/g, '&quot;')}" />
        <meta property="og:description" content="${desc.replace(/"/g, '&quot;')}" />
        <meta property="og:image" content="${img}" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${title.replace(/"/g, '&quot;')}" />
        <meta name="twitter:description" content="${desc.replace(/"/g, '&quot;')}" />
        <meta name="twitter:image" content="${img}" />
        
        <title>${title}</title>
      </head>
      <body>
        <h1>${title}</h1>
        <p>${desc}</p>
        <img src="${img}" alt="Preview" />
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate'); // cache for 1 day
    return res.status(200).send(html);
  } catch (error) {
    console.error('Error fetching asset:', error);
    return res.status(500).send('Internal Server Error');
  }
}
