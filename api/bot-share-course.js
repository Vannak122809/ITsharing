export default async function handler(req, res) {
  const { course } = req.query;

  if (!course) {
    return res.status(400).send('Missing course id');
  }

  // Hardcoded list from Courses.jsx for basic OG support
  const courseData = [
    { id: 9, title: 'Basic HTML and CSS', desc: 'Master the fundamental building blocks of the web.', coverImage: 'https://pub-4f82c0b8e14544aca1aa8a82ea8d41c1.r2.dev/Cover/ChatGPT%20Image%20Apr%206%2C%202026%2C%2011_40_05%20AM.png' },
    { id: 10, title: 'JQuery + Javascript', desc: 'Comprehensive JQuery and Javascript course from Day 1 to Day 17.', coverImage: 'https://pub-4f82c0b8e14544aca1aa8a82ea8d41c1.r2.dev/Cover/ChatGPT%20Image%20Apr%209%2C%202026%2C%2009_06_28%20AM.png' },
    { id: 1, title: 'React Masterclass', desc: 'Master modern React from Hooks to Server Components.', coverImage: 'https://img.youtube.com/vi/bMknfKXIFA8/maxresdefault.jpg' },
    { id: 4, title: 'Cisco CCNA Crash Course', desc: 'Routing, switching, and essential network protocols.', coverImage: 'https://img.youtube.com/vi/qiQR5rTSshw/maxresdefault.jpg' },
    { id: 5, title: 'Ethical Hacking 101', desc: 'Penetration testing and finding vulnerabilities.', coverImage: 'https://img.youtube.com/vi/3Kq1MIfTWCE/maxresdefault.jpg' },
    { id: 6, title: 'Python Data Science', desc: 'Learn Python from scratch and dive into Data Science.', coverImage: 'https://img.youtube.com/vi/rfscVS0vtbw/maxresdefault.jpg' },
    { id: 7, title: 'Java Masterclass', desc: 'From basic Java syntax to advanced OOP concepts.', coverImage: 'https://img.youtube.com/vi/A74TOX803D0/maxresdefault.jpg' },
    { id: 8, title: 'Node.js Backend Developer', desc: 'Build scalable APIs using Node.js, Express, and MongoDB.', coverImage: 'https://img.youtube.com/vi/f2EqECiTBL8/maxresdefault.jpg' },
    { id: 11, title: 'C/C++ Masterclass (Khmer)', desc: 'Learn C and C++ from zero to hero.', coverImage: 'https://img.youtube.com/vi/m0m5y3bXw_A/maxresdefault.jpg' },
    { id: 12, title: 'Linux Administration (Khmer)', desc: 'Essential Linux skills for networking and security.', coverImage: 'https://img.youtube.com/vi/kYv9G4w2-c8/maxresdefault.jpg' },
    { id: 13, title: 'MikroTik Networking Masterclass', desc: 'Complete MikroTik networking playlist.', coverImage: 'https://img.youtube.com/vi/NTYmkUCRlWE/maxresdefault.jpg' }
  ];

  const foundCourse = courseData.find(c => String(c.id) === course);

  if (!foundCourse) {
    return res.status(404).send('Course not found');
  }

  const title = foundCourse.title || 'ITShare Course';
  const desc = foundCourse.desc || 'Take this course on ITShare';
  const img = foundCourse.coverImage || 'https://itsharing.vercel.app/og-image.jpg';

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
}
