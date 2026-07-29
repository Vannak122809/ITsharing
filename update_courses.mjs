import fs from 'fs';
let content = fs.readFileSync('src/pages/Courses.jsx', 'utf8');

// 1. Import AuthModal
content = content.replace(
  'import { PlayCircle, Award, Search, Filter, Clock, BookOpen, ChevronRight, ChevronDown, ChevronUp, X, Play, Shield, Star, CheckCircle2, Layout, Code2, Globe2, Sparkles, Brain } from \'lucide-react\';',
  'import { PlayCircle, Award, Search, Filter, Clock, BookOpen, ChevronRight, ChevronDown, ChevronUp, X, Play, Shield, Star, CheckCircle2, Layout, Code2, Globe2, Sparkles, Brain } from \'lucide-react\';\nimport AuthModal from \'../components/AuthModal\';'
);

// 2. Add authModalOpen state
content = content.replace(
  'const [expandedSections, setExpandedSections] = useState({});',
  'const [expandedSections, setExpandedSections] = useState({});\n  const [authModalOpen, setAuthModalOpen] = useState(false);'
);

// 3. Update handleStartCourse
content = content.replace(
  '    if (isGuest) {\n      navigate(\'/login\');\n      return;\n    }',
  '    if (isGuest) {\n      setAuthModalOpen(true);\n      return;\n    }'
);

// 4. Add AuthModal component inside render
content = content.replace(
  '      {/* HERO SECTION */}',
  '      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} message="You need to be logged in to view and start courses." />\n\n      {/* HERO SECTION */}'
);

// 5. Update HTML/CSS lessons with Days
const htmlCssMatch = content.match(/title: \'Basic HTML and CSS\'.*?lessons: \[([\s\S]*?)\]\n    \},/s);
if (htmlCssMatch) {
  const lessonsBlock = htmlCssMatch[1];
  const lines = lessonsBlock.split('\n');
  let newLines = [];
  let videoCount = 0;
  for (let line of lines) {
    if (line.includes('{ title:')) {
      let dayNum = Math.floor(videoCount / 5) + 1;
      let newLine = line.replace(' }', `, day: 'Day ${dayNum}' }`);
      newLines.push(newLine);
      videoCount++;
    } else {
      newLines.push(line);
    }
  }
  content = content.replace(lessonsBlock, newLines.join('\n'));
}

fs.writeFileSync('src/pages/Courses.jsx', content);
console.log('Courses.jsx updated successfully!');
