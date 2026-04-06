import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Award, Search, Filter, Clock, BookOpen, ChevronRight, X, Play, Shield, Star, CheckCircle2, Layout, Code2, Globe2, Sparkles, Brain } from 'lucide-react';
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
  const navigate = useNavigate();

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
    } else {
      alert(t('coming_soon'));
    }
  };

  return (
    <div className="courses-page" style={{ paddingTop: '80px', minHeight: '100vh', background: 'var(--bg-main)' }}>
      <div className="container">
        
        {/* ENHANCED HERO */}
        <header className="courses-hero">
          <div className="hero-badge"><Sparkles size={14} /> {t('explore_courses')}</div>
          <h1 className="hero-title text-gradient">{t('short_video_courses')}</h1>
          <p className="hero-desc">{t('courses_subtitle')}</p>

          <div className="search-filter-hub">
             <div className="search-box-premium">
                <Search size={20} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search courses..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && <X size={18} className="clear-icon" onClick={() => setSearchQuery('')} />}
             </div>
             
             <div className="category-chips">
                {categories.map(category => (
                  <button 
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`chip ${activeCategory === category ? 'active' : ''}`}
                  >
                    {t(category.toLowerCase())}
                  </button>
                ))}
             </div>
          </div>
        </header>

        {/* STATS STRIP */}
        <div className="stats-row">
           <div className="stat-pill"><Brain size={16} /> <span>120+ Interactive Lessons</span></div>
           <div className="stat-pill"><Layout size={16} /> <span>4 Complete Learning Paths</span></div>
           <div className="stat-pill"><Shield size={16} /> <span>Lifetime Community Access</span></div>
        </div>

        {/* GRID */}
        <div className="course-grid-lux">
          {filteredCourses.map(course => (
            <div key={course.id} className="course-card-lux" onClick={() => handleStartCourse(course)}>
              <div className="card-media">
                 {course.coverImage ? (
                   <img src={course.coverImage} alt={course.title} className="cover-img" />
                 ) : (
                   <div className="no-cover" style={{ backgroundColor: `${course.color}20` }}>
                      <PlayCircle size={48} color={course.color} />
                   </div>
                 )}
                 {course.isNew && <div className="new-badge">ULTRA NEW</div>}
                 <div className="cat-overlay" style={{ color: course.color }}>{course.category}</div>
              </div>

              <div className="card-body">
                <h3 className="card-title">{course.title}</h3>
                <p className="card-text">{course.desc}</p>
                
                <div className="card-info">
                   <div className="info-tag"><BookOpen size={14} /> {course.lessonsCount} Lessons</div>
                   <div className="info-tag"><Clock size={14} /> Self-paced</div>
                </div>

                <div className="card-cta">
                   <button className="btn-play-lux" style={{ '--accent': course.color }}>
                      <Play size={16} fill="currentColor" />
                      <span>{t('start_course')}</span>
                   </button>
                </div>
              </div>
            </div>
          ))}
          
          {filteredCourses.length === 0 && (
            <div className="no-results">
              <Code2 size={64} className="no-res-icon" />
              <h3>Course matching "{searchQuery}" not found</h3>
              <p>Try searching for a different topic or browser our categories above.</p>
            </div>
          )}
        </div>
      </div>

      {/* LUXURY VIEWER */}
      {selectedCourse && (
        <div className="viewer-backdrop">
           <div className="viewer-stage glass-panel">
              <div className="viewer-nav">
                 <div className="nav-left">
                    <span className="course-label">{selectedCourse.category} Track</span>
                    <h2 className="lesson-display">{selectedCourse.lessons[activeLesson].title}</h2>
                 </div>
                 <button className="nav-close" onClick={() => setSelectedCourse(null)}>
                    <X size={24} />
                 </button>
              </div>
              <div className="viewer-main">
                 <div className="video-viewport" onContextMenu={(e) => e.preventDefault()}>
                    <div className="security-overlay"></div>
                    <iframe 
                       src={`https://drive.google.com/file/d/${selectedCourse.lessons[activeLesson].id}/preview`} 
                       width="100%" 
                       height="100%" 
                       allow="autoplay" 
                       frameBorder="0"
                       title="Course Video"
                       className="main-iframe"
                    />
                 </div>

                 <div className="playlist-sidebar">
                    <div className="playlist-header">
                       <Layout size={18} />
                       <span>Lessons</span>
                       <div className="prog-pill">{activeLesson + 1} / {selectedCourse.lessonsCount}</div>
                    </div>
                    <div className="playlist-scroll">
                       {selectedCourse.lessons.map((lesson, idx) => (
                         <div 
                           key={idx} 
                           className={`p-item ${activeLesson === idx ? 'cur' : ''}`}
                           onClick={() => setActiveLesson(idx)}
                         >
                            <div className="p-num">{idx + 1}</div>
                            <div className="p-info">
                               <span className="p-title">{lesson.title}</span>
                               <span className="p-meta">Module {Math.floor(idx/10) + 1}</span>
                            </div>
                            {activeLesson === idx && <div className="pulse-dot"></div>}
                         </div>
                       ))}
                    </div>
                    
                    <div className="playlist-footer">
                       <button className="btn-resource">
                          <Star size={14} /> Download Source Code
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      <style>{`
        .courses-hero { text-align: center; margin-bottom: 40px; }
        .hero-badge { 
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 16px; border-radius: 40px; background: rgba(99, 102, 241, 0.1);
          color: var(--primary); font-size: 0.75rem; font-weight: 800; text-transform: uppercase;
          margin-bottom: 24px; border: 1px solid rgba(99, 102, 241, 0.2);
        }
        .hero-title { font-size: 4rem; font-weight: 950; margin-bottom: 20px; letter-spacing: -2px; }
        .hero-desc { font-size: 1.25rem; color: var(--text-muted); max-width: 600px; margin: 0 auto 40px; }

        .search-filter-hub { display: flex; flex-direction: column; align-items: center; gap: 24px; }
        .search-box-premium { 
          display: flex; align-items: center; gap: 14px; background: var(--nav-bg);
          border: 1px solid var(--surface-border); padding: 14px 28px; border-radius: 50px;
          width: 100%; max-width: 500px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          transition: 0.3s;
        }
        .search-box-premium:focus-within { border-color: var(--primary); transform: scale(1.02); }
        .search-box-premium input { background: none; border: none; color: var(--text-main); font-size: 1rem; width: 100%; outline: none; }
        .search-icon { color: var(--text-muted); }
        .clear-icon { color: var(--text-muted); cursor: pointer; }

        .category-chips { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
        .chip { 
          background: var(--nav-bg); border: 1px solid var(--surface-border); color: var(--text-muted);
          padding: 8px 22px; border-radius: 40px; font-weight: 700; cursor: pointer; transition: 0.2s;
        }
        .chip:hover { border-color: var(--primary); color: var(--text-main); }
        .chip.active { background: var(--primary); color: #fff; border-color: var(--primary); }

        .stats-row { display: flex; justify-content: center; gap: 24px; margin-bottom: 60px; flex-wrap: wrap; }
        .stat-pill { display: flex; align-items: center; gap: 10px; background: var(--surface-badge); padding: 8px 18px; border-radius: 12px; font-size: 0.85rem; color: var(--text-main); font-weight: 600; border: 1px solid var(--surface-border); }

        .course-grid-lux { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 32px; }
        .course-card-lux { 
          background: var(--nav-bg); border: 1px solid var(--surface-border); border-radius: 32px;
          overflow: hidden; cursor: pointer; transition: all 0.4s cubic-bezier(0.2, 0, 0, 1);
          display: flex; flex-direction: column;
        }
        .course-card-lux:hover { transform: translateY(-12px); border-color: var(--primary); box-shadow: 0 30px 60px rgba(0,0,0,0.3); }
        
        .card-media { height: 210px; position: relative; overflow: hidden; }
        .cover-img { width: 100%; height: 100%; object-fit: cover; transition: 0.6s; }
        .course-card-lux:hover .cover-img { transform: scale(1.1); }
        .no-cover { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
        
        .new-badge { position: absolute; top: 16px; left: 16px; background: #00fa9a; color: #000; padding: 4px 14px; border-radius: 40px; font-size: 0.7rem; font-weight: 900; }
        .cat-overlay { position: absolute; bottom: 16px; right: 16px; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); padding: 4px 14px; border-radius: 10px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; border: 1px solid currentColor; }

        .card-body { padding: 30px; display: flex; flex-direction: column; flex-grow: 1; }
        .card-title { font-size: 1.6rem; font-weight: 900; color: var(--text-main); margin-bottom: 12px; }
        .card-text { color: var(--text-muted); line-height: 1.6; font-size: 1rem; margin-bottom: 24px; flex-grow: 1; }
        
        .card-info { display: flex; gap: 16px; margin-bottom: 24px; }
        .info-tag { font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px; font-weight: 600; background: var(--surface-badge); padding: 5px 12px; border-radius: 10px; }

        .btn-play-lux { 
          width: 100%; background: none; border: 2px solid var(--surface-border); color: var(--text-main);
          padding: 14px; border-radius: 18px; font-weight: 800; font-size: 1rem;
          display: flex; align-items: center; justify-content: center; gap: 12px;
          cursor: pointer; transition: 0.3s;
        }
        .course-card-lux:hover .btn-play-lux { background: var(--accent); color: #000; border-color: var(--accent); }

        .no-results { grid-column: 1 / -1; text-align: center; padding: 100px 0; color: var(--text-muted); }
        .no-res-icon { margin-bottom: 24px; opacity: 0.2; }

        /* VIEWER SYSTEM */
        .viewer-backdrop { 
          position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
          background: rgba(8, 8, 12, 0.95); z-index: 10000; display: flex; 
          align-items: center; justify-content: center; padding: 15px; backdrop-filter: blur(12px);
        }
        .viewer-stage { 
          width: 100%; max-width: 1440px; height: 92vh; border-radius: 32px;
          display: flex; flex-direction: column; overflow: hidden;
          box-shadow: 0 0 100px rgba(99, 102, 241, 0.2); border: 1px solid rgba(255,255,255,0.05);
        }
        .viewer-nav { padding: 24px 40px; border-bottom: 1px solid var(--surface-border); display: flex; justify-content: space-between; align-items: center; }
        .nav-left .course-label { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: var(--primary); letter-spacing: 1px; }
        .lesson-display { font-size: 1.6rem; font-weight: 900; margin: 4px 0 0; color: var(--text-main); }
        .nav-close { background: var(--surface-badge); border: none; color: var(--text-main); width: 48px; height: 48px; border-radius: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
        .nav-close:hover { background: #ff2a7a; transform: rotate(90deg); }

        .viewer-main { display: flex; flex-grow: 1; overflow: hidden; }
        .video-viewport { flex-grow: 1; background: #000; overflow: hidden; position: relative; user-select: none; -webkit-user-select: none; }
        .security-overlay { 
          position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
          z-index: 10; pointer-events: none;
          background: repeating-linear-gradient(45deg, transparent, transparent 100px, rgba(255,255,255,0.01) 100px, rgba(255,255,255,0.01) 200px);
        }
        .main-iframe { width: 100%; height: 100%; pointer-events: auto; }

        .playlist-sidebar { width: 380px; border-left: 1px solid var(--surface-border); display: flex; flex-direction: column; background: var(--nav-bg); }
        .playlist-header { padding: 24px; font-weight: 800; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid var(--surface-border); }
        .prog-pill { margin-left: auto; background: var(--primary); color: #fff; font-size: 0.75rem; padding: 4px 12px; border-radius: 40px; }
        
        .playlist-scroll { flex-grow: 1; overflow-y: auto; padding: 16px; }
        .p-item { 
          padding: 16px 20px; border-radius: 20px; display: flex; align-items: center; gap: 16px;
          cursor: pointer; transition: 0.3s; margin-bottom: 10px; border: 1px solid transparent;
        }
        .p-item:hover { background: rgba(255,255,255,0.03); }
        .p-item.cur { background: rgba(99, 102, 241, 0.1); border-color: var(--primary); }
        
        .p-num { font-size: 0.8rem; font-weight: 800; opacity: 0.4; }
        .cur .p-num { opacity: 1; color: var(--primary); }
        .p-info { display: flex; flex-direction: column; flex-grow: 1; }
        .p-title { font-size: 0.9rem; font-weight: 700; color: var(--text-main); margin-bottom: 2px; }
        .p-meta { font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; font-weight: 800; }
        
        .pulse-dot { width: 6px; height: 6px; background: var(--primary); border-radius: 50%; box-shadow: 0 0 10px var(--primary); animation: pDot 1.5s infinite; }
        @keyframes pDot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.5); } }

        .playlist-footer { padding: 24px; border-top: 1px solid var(--surface-border); }
        .btn-resource { width: 100%; padding: 12px; border-radius: 12px; background: var(--surface-badge); border: 1px solid var(--surface-border); color: var(--text-main); font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; transition: 0.2s; }
        .btn-resource:hover { border-color: var(--primary); background: rgba(99, 102, 241, 0.05); }

        @media (max-width: 1100px) {
           .viewer-main { flex-direction: column; overflow-y: auto; }
           .video-viewport { min-height: 400px; height: 50vh; flex-grow: 0; }
           .playlist-sidebar { width: 100%; border-left: none; border-top: 1px solid var(--surface-border); height: auto; }
           .hero-title { font-size: 3rem; }
        }
        @media (max-width: 768px) {
           .hero-title { font-size: 2.5rem; }
           .course-grid-lux { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default Courses;
