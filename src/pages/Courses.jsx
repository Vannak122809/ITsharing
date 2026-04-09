import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Award, Search, Filter, Clock, BookOpen, ChevronRight, ChevronDown, ChevronUp, X, Play, Shield, Star, CheckCircle2, Layout, Code2, Globe2, Sparkles, Brain } from 'lucide-react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useLanguage } from '../LanguageContext';

const Courses = () => {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeLesson, setActiveLesson] = useState(0);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});
  const navigate = useNavigate();

  const groupedLessons = useMemo(() => {
    if (!selectedCourse || !selectedCourse.lessons) return [];
    return selectedCourse.lessons.reduce((acc, lesson, i) => {
      const gName = lesson.day || `Module ${Math.floor(i/10) + 1}`;
      let group = acc.find(g => g.name === gName);
      if (!group) {
        group = { name: gName, items: [] };
        acc.push(group);
      }
      group.items.push({ ...lesson, originalIndex: i });
      return acc;
    }, []);
  }, [selectedCourse]);

  const toggleSection = (gName) => {
    setExpandedSections(prev => ({ ...prev, [gName]: !prev[gName] }));
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const isGuest = !authLoading && (!user || user.isAnonymous);

  const categories = ['All', 'Code', 'Web', 'Network', 'Computer', 'Security', 'Cloud'];

  const courseData = [
    {
      id: 9,
      title: 'Basic HTML and CSS',
      category: 'Web',
      lessonsCount: 48,
      desc: 'Master the fundamental building blocks of the web. From zero to building professional responsive layouts.',
      color: '#e34f26',
      isNew: true,
      coverImage: 'https://pub-4f82c0b8e14544aca1aa8a82ea8d41c1.r2.dev/Cover/ChatGPT%20Image%20Apr%206%2C%202026%2C%2011_40_05%20AM.png',
      lessons: [
        { title: 'Introduction to Web Dev', id: '1jvLSC9Lo5ty1qBHfNoz9NEJZA9UQwyGn' },
        { title: 'HTML Boilerplate & Structure', id: '13SXJVETMa0_IgPLZ550zHTeJzfXrH2D_' },
        { title: 'Headings and Paragraphs', id: '1yMWs24CM-9wU_Z5SoxsVTcFdlv9xi8kL' },
        { title: 'Links and Navigation', id: '1Z0iwR07Iom3kF3qdiIY3zb8cgYyiP8eV' },
        { title: 'Images and Alt Text', id: '1YNHOUoYlaQrrH51KghN7XyQc2MZ5lYCO' },
        { title: 'Lists and Tables', id: '1YctZcG7G7iAa-eXypn9pa0Y2aNdlCv6E' },
        { title: 'Forms and Inputs', id: '1ODUcD4KEkGXpJ_ZwjI8LET-GEsFzw7hQ' },
        { title: 'Divs and Spans (The Box Model)', id: '1C8h4MISI98wlDSW7r-zgiQ1fVDFUnXs8' },
        { title: 'ID vs Class Selectors', id: '1xBGy_VHCLLB4l31M_4Ma28T1Jmbpwcbj' },
        { title: 'CSS Inline vs Internal vs External', id: '1UbxRoXJJZbPXc9K0fkXmnjk22ws5-9Gu' },
        { title: 'Colors and Hex Codes', id: '14vr8QpcRgtmAois2eNv16HEMAoPx7N8a' },
        { title: 'Background Images & Properties', id: '1CbQE7Q0K_2_MU4soi5nepMtNRGsu-XVu' },
        { title: 'Fonts and Typography', id: '1h-N8sNMhupSH8Slmp1V-qKAIJXMCoWP5' },
        { title: 'Padding vs Margin', id: '1rxbk_NPFeGHaO8aDb2ZTEVEOrKsO_5R9' },
        { title: 'Border and Outline', id: '1XT9WOQnKCX4Mjqi0TfkqeNLdIBPKcemd' },
        { title: 'CSS Units: px, rem, em', id: '1eups_gQxWUwjxUTp1MEYlYtwG1IA-h9R' },
        { title: 'Position: Static, Relative, Absolute', id: '1gV5huYjHang-p8mPBNthee9ypsuWGisD' },
        { title: 'Position: Fixed and Sticky', id: '1zYsmV29YouMnprT04f_CjFkCM0xTjjt7' },
        { title: 'Flexbox: Container Properties', id: '1wyOZQvs3NoyRikVDdSxQE3EwsKfVKn7_' },
        { title: 'Flexbox: Item Properties', id: '1ux3uvt7bT-v0Vay3yuf1ijAo_xCLTMPm' },
        { title: 'Flexbox: Practice Project', id: '1ux3uvt7bT-v0Vay3yuf1ijAo_xCLTMPm' },
        { title: 'Grid: Basics and Fractions', id: '1JnKogi2zM0FVqVqyfOeXYWyM02KVbVoX' },
        { title: 'Grid: Areas and Gaps', id: '1qG-oeVKIyu6trhaK-mucZdL-niFSwiMO' },
        { title: 'Media Queries for Mobile', id: '11PtwrivRzXVeb2PRl79V2v1jYXHq8LRG' },
        { title: 'Pseudo-classes: Hover & Active', id: '1ao9BYxmtzKhHjDU6WkyYozdmSIb4-8S0' },
        { title: 'Transitions and Animations', id: '1lApcTqJ-YjI6QYEwqXm0ji206RXtzA34' },
        { title: 'Z-index and Layering', id: '1-vu22HE0FfgFh9k6oM2ICbRBUc46ldjy' },
        { title: 'Variables in CSS', id: '1_gqx3Xxjucsj-hTaEHgxOqq6yAWUpzRl' },
        { title: 'Best Practices for Clean Code', id: '1pF3_S58G9ESO7T7uYuy5C-inD6GTIjq5' },
        { title: 'Debugging with DevTools', id: '1wUQJUworoYMRoFQB-zmtIO6GFNh1G8lO' },
        { title: 'Semantic HTML5', id: '1JFeqmWkzWNcttQ2WLl03OWlOgU-m1dVb' },
        { title: 'SVG Icons Integration', id: '1KVMOyhcQOKa7bzEfLQjDfvPn_YoapVyU' },
        { title: 'Google Fonts Setup', id: '17Us7I001SjbS8IGWxfAFHriGRmFxHuql' },
        { title: 'Shadows and Blur Effects', id: '1GQfgDLsF3hPDl0bD5QwLQ9pHK_r8bHD5' },
        { title: 'Gradients and Masks', id: '1JxsBeluIwfvvGw7XqEBhtkyycgm6EHZn' },
        { title: 'CSS Specificity', id: '17i-wS5jgFDW5Dg-xQSxW5LexQfzVtjfs' },
        { title: 'Overflow and Visibility', id: '1oIvY0mXQw4IGjlJprRz1mgPPJjmyaDEQ' },
        { title: 'Responsive Navbar Project', id: '1m-VwggiyJ-We3xtJ6dsMZeQDTAQj42uF' },
        { title: 'Hero Section Design', id: '1yZDvFaeBLO23miDuUlCEf6VK74ITFtTD' },
        { title: 'Footer and Layout Finish', id: '1s2CqEvfm7rUzocRf6iYzYHtq77yO3Q-P' },
        { title: 'Deploying to Netlify', id: '1aShzx-Kv42Sc8AT0UzUnu0I79NCTVjvx' },
        { title: 'Introduction to SEO', id: '15URULrYDcUQx0xOHbsM9louMn0UB9MI6' },
        { title: 'Accessibility (A11y)', id: '1cjArhvTIGujzdOfW4jrMLsvXT9dIHAy2' },
        { title: 'CSS Frameworks Overview', id: '1C5pLLUBxf0IXKLB-ShwqoO2xbgpPqqe6' },
        { title: 'GitHub for UI Projects', id: '1DEEVDKVrFWNBuB0JOdqM_BfNPJR06hx3' },
        { title: 'Advanced Flex Inter-layouts', id: '1jOUEN7YaExYKCfl2C0YBfjEBL8I82N3O' },
        { title: 'Form Verification Styling', id: '1anyrQGg-Tv0u98EMLDqGoCykdmLKUB0L' },
        { title: 'Course Final Wrap-up', id: '1sxniTAlp2KdxvjyXrCwT3uDxQqFTOSoL' }
      ]
    },
    {
      id: 10,
      title: 'JQuery + Javascript',
      category: 'Web',
      lessonsCount: 31,
      desc: 'Comprehensive JQuery and Javascript course from Day 1 to Day 17. Master front-end interactive web development.',
      color: '#f7df1e',
      isNew: true,
      coverImage: 'https://pub-4f82c0b8e14544aca1aa8a82ea8d41c1.r2.dev/Cover/ChatGPT%20Image%20Apr%209%2C%202026%2C%2009_06_28%20AM.png',
      documents: [
        { day: 'Day 1', url: 'https://pub-564a73e336f14a32b457c2d7fa1b0446.r2.dev/documents/js-slide%20(2).pptx', title: 'JS Slide' }
      ],
      lessons: [
        { title: '1', id: '1N014TuoIvA8FgH8H-g4hHJUpgRwVUDUp', day: 'Day 1' },
        { title: '2', id: '1JOhtHo6uNGJ1fwAvQllDDS5il-mU9J13', day: 'Day 1' },
        { title: '4', id: '1Jsm68t3qmm2rHZctukb00VEZVxVOpzdE', day: 'Day 2' },
        { title: '3', id: '1LEmPZ82szFrpwVIIEtxcIzfkIGIy_jms', day: 'Day 2' },
        { title: '5', id: '1-u2r1B1WqpynM7MBwlLAq7_exO0_W6jS', day: 'Day 3' },
        { title: '6', id: '1iztvXtNn9onjIcOchjShBHSsHTndB1d8', day: 'Day 3' },
        { title: '8', id: '1BeNB5ewc5ndp5awSksTgU3GZGb0hfoOv', day: 'Day 4' },
        { title: '7', id: '1Jccy87Vct7dB6xcIM5EQjhDJGEKpTtjk', day: 'Day 4' },
        { title: '11', id: '1H10PsDY-OyhJiC0eOntEsrcW6WWtxdmp', day: 'Day 5' },
        { title: '12', id: '1KyIfbkGUrtIitR_0EjlWEA4jKm5o_FHD', day: 'Day 5' },
        { title: '9', id: '1L3Be5zWbzaNO9OCsLpB2eseOplY0yUdw', day: 'Day 5' },
        { title: '10', id: '1lk2Yn4yYhPYpqdhiPB8hUr3iuVQrUUvq', day: 'Day 5' },
        { title: '14', id: '1Ine3YmfiQdwaw-3m0tEh2-1NT-9JTVBU', day: 'Day 6' },
        { title: '13', id: '1UgeBrpjr4OAn7-K4jO6H7VSjZu9KlK7B', day: 'Day 6' },
        { title: '15', id: '1-pVDahooh19q4mdQKlBCxiW-D0tneu_j', day: 'Day 7' },
        { title: '16 (2)', id: '1ggmww9wG2hWiX9ciI_iRmQL_IYIjqhoV', day: 'Day 7' },
        { title: '17 (2)', id: '1jonfZo5g-VkO4vdoGxGmAum-rgPPrb-D', day: 'Day 8' },
        { title: '19 (2)', id: '1KqKu_JfMF11Yyty4-rkoelodtq0dO6uu', day: 'Day 9' },
        { title: '18 (2)', id: '1XCLxx624n5zUz2zYWwnuAE0nq8WVbpAb', day: 'Day 9' },
        { title: '21 (2)', id: '1pp6R93MS2Uz_z7GsodeqBo-jt8LTGo-6', day: 'Day 10' },
        { title: '20 (2)', id: '1sN30xAYbWUkpHJH3KiQLqngB1IWIOs4G', day: 'Day 10' },
        { title: '24 (2)', id: '1HrpiQsKq9PbomviLnXrqHbniAyE52X7P', day: 'Day 11' },
        { title: '25 (2)', id: '1sFe47EEOBf6d-XNJOST2VLV4Vj8bt8EK', day: 'Day 12' },
        { title: '27 (2)', id: '1QqXg_NjPrRg5apIzvX9QBxGZnoPrMp_O', day: 'Day 13' },
        { title: '26 (2)', id: '1kbHahJnw7dMM4Tl8Z6i1brpKY-1yL5kg', day: 'Day 13' },
        { title: '29 (2)', id: '1fmid9DU7bNEvX0PGIss2vVe3VBMcO55_', day: 'Day 14' },
        { title: '28 (2)', id: '1nMWIBReLr3o_3IgtaEFAbpcKI3Dz1epE', day: 'Day 14' },
        { title: 'JQery', id: '1XFrLKyxFwiAIaVPsjkNvyKMLbLNcdvY7', day: 'Day 15' },
        { title: 'Day 16', id: '13gjIyjZvjk_KP7soBu8n5bN6aoaRhVx6', day: 'Day 16' },
        { title: 'Day 171', id: '1KS45apm6UJeO68IjJID1lb339ozG5Gmv', day: 'Day 17' },
        { title: 'Day 17', id: '1QwH2XLpnVRSjq0T2XdDiPju4dMzavEmp', day: 'Day 17' }
      ]
    },
    {
      id: 1,
      title: 'React Masterclass',
      category: 'Code',
      lessonsCount: 14,
      desc: 'Master modern React from Hooks to Server Components. Build real-world apps with professional architecture.',
      color: 'var(--primary)',
      lessons: []
    },
    {
      id: 4,
      title: 'Cisco CCNA Crash Course',
      category: 'Network',
      lessonsCount: 12,
      desc: 'Routing, switching, and essential network protocols for the modern administrator.',
      color: '#ff9900',
      lessons: []
    },
    {
      id: 5,
      title: 'Ethical Hacking 101',
      category: 'Security',
      lessonsCount: 15,
      desc: 'Penetration testing and finding vulnerabilities. Master the tools and mindset of a security pro.',
      color: '#ff2a7a',
      lessons: []
    }
  ];

  const filteredCourses = useMemo(() => {
    return courseData.filter(course => {
      const matchesCategory = activeCategory === 'All' || course.category === activeCategory;
      const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           course.desc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const handleStartCourse = (course) => {
    if (isGuest) {
      navigate('/login');
      return;
    }
    if (course.lessons && course.lessons.length > 0) {
      setSelectedCourse(course);
      setActiveLesson(0);
      const firstSection = course.lessons[0].day || 'Module 1';
      setExpandedSections({ [firstSection]: true });
    } else {
      alert(t('coming_soon'));
    }
  };

  return (
    <div className="container" style={{ paddingTop: '100px', paddingBottom: '100px', minHeight: '100vh' }}>
      
      {/* HERO SECTION */}
      <header style={{ textAlign: 'center', marginBottom: '80px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '-150px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '600px', background: 'var(--primary)', filter: 'blur(200px)', opacity: 0.1, zIndex: -1 }} />
        
        <div className="badge-glow" style={{ marginBottom: '24px' }}>
          <Sparkles size={14} /> {t('explore_courses')}
        </div>
        <h1 className="text-gradient" style={{ fontSize: '4.5rem', fontWeight: 900, marginBottom: '24px', letterSpacing: '-0.03em' }}>
          {t('short_video_courses')}
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', maxWidth: '650px', margin: '0 auto 50px', lineHeight: 1.6 }}>
          {t('courses_subtitle')}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}>
           <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 28px', borderRadius: '24px', maxWidth: '550px', width: '100%' }}>
              <Search size={22} color="var(--text-muted)" />
              <input 
                type="text" 
                placeholder="Search for courses or topics..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ background: 'none', border: 'none', color: 'var(--text-main)', fontSize: '1.1rem', width: '100%', outline: 'none', fontWeight: 500 }}
              />
              {searchQuery && <X size={18} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setSearchQuery('')} />}
           </div>
           
           <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {categories.map(category => (
                <button 
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '16px',
                    border: '1px solid var(--surface-border)',
                    background: activeCategory === category ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                    color: activeCategory === category ? '#fff' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: '0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: activeCategory === category ? '0 10px 20px rgba(37, 99, 235, 0.2)' : 'none'
                  }}
                >
                  {t(category.toLowerCase())}
                </button>
              ))}
           </div>
        </div>
      </header>

      {/* STATS STRIP */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '80px', flexWrap: 'wrap' }}>
         <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 24px', borderRadius: '18px', fontSize: '0.9rem', fontWeight: 700 }}>
            <Brain size={18} color="var(--primary)" /> <span>120+ Interactive Lessons</span>
         </div>
         <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 24px', borderRadius: '18px', fontSize: '0.9rem', fontWeight: 700 }}>
            <Layout size={18} color="#8b5cf6" /> <span>4 Complete Learning Paths</span>
         </div>
         <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 24px', borderRadius: '18px', fontSize: '0.9rem', fontWeight: 700 }}>
            <Shield size={18} color="#10b981" /> <span>Lifetime Access</span>
         </div>
      </div>

      {/* GRID */}
      <div className="card-grid">
        {filteredCourses.map(course => (
          <div key={course.id} className="glass-panel luxury-card" style={{ padding: '0', borderRadius: '32px', overflow: 'hidden', cursor: 'pointer' }} onClick={() => handleStartCourse(course)}>
            <div style={{ height: '220px', position: 'relative', overflow: 'hidden' }}>
               {course.coverImage ? (
                 <img src={course.coverImage} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
               ) : (
                 <div style={{ width: '100%', height: '100%', background: `${course.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PlayCircle size={64} style={{ color: course.color, opacity: 0.5 }} />
                 </div>
               )}
               {course.isNew && <div className="new-badge" style={{ position: 'absolute', top: '20px', left: '20px' }}>NEW</div>}
               <div style={{ position: 'absolute', bottom: '20px', right: '20px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', padding: '6px 16px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800, color: course.color, border: `1px solid ${course.color}40`, textTransform: 'uppercase' }}>
                 {course.category}
               </div>
            </div>

            <div style={{ padding: '32px' }}>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '14px', lineHeight: 1.2 }}>{course.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '28px' }}>{course.desc}</p>
              
              <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                 <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, background: 'var(--surface-badge)', padding: '6px 14px', borderRadius: '12px' }}>
                   <BookOpen size={16} /> {course.lessonsCount} Lessons
                 </div>
                 <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, background: 'var(--surface-badge)', padding: '6px 14px', borderRadius: '12px' }}>
                   <Clock size={16} /> Self-paced
                 </div>
              </div>

              <button className="btn btn-primary" style={{ width: '100%', padding: '16px', borderRadius: '18px', fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', background: course.color, borderColor: course.color }}>
                <Play size={18} fill="currentColor" />
                {t('start_course')}
              </button>
            </div>
          </div>
        ))}
        
        {filteredCourses.length === 0 && (
          <div className="empty-state glass-panel" style={{ borderRadius: '32px', gridColumn: '1 / -1' }}>
            <Code2 size={64} style={{ opacity: 0.1, marginBottom: '24px' }} />
            <h3>Course matching "{searchQuery}" not found</h3>
            <p>Try searching for a different topic or browse our categories above.</p>
          </div>
        )}
      </div>

      {/* LUXURY VIEWER */}
      {selectedCourse && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(20px)' }}>
           <div className="glass-panel" style={{ width: '100%', maxWidth: '1440px', height: '90vh', borderRadius: '40px', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 0 100px rgba(0,0,0,0.5)' }}>
              
              <div style={{ padding: '24px 40px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                 <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.1em' }}>{selectedCourse.category} Track</span>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginTop: '4px', color: '#fff' }}>{selectedCourse.lessons[activeLesson].title}</h2>
                 </div>
                 <button 
                  onClick={() => setSelectedCourse(null)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', width: '54px', height: '54px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.3s' }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.transform = 'rotate(90deg)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'rotate(0deg)'; }}
                 >
                    <X size={24} />
                 </button>
              </div>

              <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
                 <div style={{ flexGrow: 1, background: '#000', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, pointerEvents: 'none', background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.2) 100%)' }} />
                    <iframe 
                       src={`https://drive.google.com/file/d/${selectedCourse.lessons[activeLesson].id}/preview`} 
                       width="100%" 
                       height="100%" 
                       allow="autoplay" 
                       frameBorder="0"
                       title="Course Video"
                       style={{ border: 'none' }}
                    />
                 </div>

                 <div style={{ width: '400px', borderLeft: '1px solid var(--surface-border)', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ padding: '24px', fontWeight: 800, borderBottom: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Layout size={18} /> Lesson Content</div>
                       <div style={{ background: 'var(--primary)', color: '#fff', fontSize: '0.75rem', padding: '6px 14px', borderRadius: '40px' }}>{activeLesson + 1} / {selectedCourse.lessonsCount}</div>
                    </div>
                    
                    <div style={{ flexGrow: 1, overflowY: 'auto', padding: '20px' }}>
                       {groupedLessons.map((group, groupIdx) => (
                         <div key={groupIdx} style={{ marginBottom: '16px', border: '1px solid var(--surface-border)', borderRadius: '20px', overflow: 'hidden' }}>
                           <div 
                             onClick={() => toggleSection(group.name)}
                             style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.03)', transition: '0.3s' }}
                           >
                             <div style={{ display: 'flex', flexDirection: 'column' }}>
                               <span style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>{group.name}</span>
                               <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{group.items.length} lectures</span>
                             </div>
                             {expandedSections[group.name] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                           </div>
                           
                           {expandedSections[group.name] && (
                             <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--surface-border)' }}>
                               {group.items.map((item) => (
                                 <div 
                                   key={item.originalIndex}
                                   onClick={() => setActiveLesson(item.originalIndex)}
                                   style={{ 
                                     padding: '16px 20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px',
                                     cursor: 'pointer', transition: '0.3s', 
                                     background: activeLesson === item.originalIndex ? 'var(--primary)' : 'transparent',
                                     color: activeLesson === item.originalIndex ? '#fff' : 'var(--text-main)'
                                   }}
                                 >
                                    <div style={{ fontSize: '0.8rem', fontWeight: 800, opacity: 0.5 }}>{item.originalIndex + 1}</div>
                                    <div style={{ flexGrow: 1 }}>
                                       <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{item.title}</div>
                                       <div style={{ fontSize: '0.7rem', opacity: 0.7, fontWeight: 800, textTransform: 'uppercase' }}>Lecture {item.originalIndex + 1}</div>
                                    </div>
                                    {activeLesson === item.originalIndex && <div style={{ width: '8px', height: '8px', background: '#fff', borderRadius: '50%', boxShadow: '0 0 10px #fff' }} />}
                                 </div>
                               ))}
                               {selectedCourse.documents && selectedCourse.documents.filter(d => d.day === group.name).map((doc, idx) => (
                                 <a key={`doc-${idx}`} href={doc.url} target="_blank" rel="noreferrer" style={{ padding: '14px', borderRadius: '14px', border: '1px dashed var(--primary)', textAlign: 'center', fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)', textDecoration: 'none', background: 'rgba(37, 99, 235, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                   <BookOpen size={16} /> Download {doc.title}
                                 </a>
                               ))}
                             </div>
                           )}
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};


export default Courses;
