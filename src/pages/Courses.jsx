import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Award, Search, Filter } from 'lucide-react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const Courses = () => {
  const [activeCategory, setActiveCategory] = useState('All');
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

  const categories = ['All', 'Network', 'Code', 'Computer', 'Security', 'Cloud'];

  const courseData = [
    {
      id: 1,
      title: 'React Masterclass',
      category: 'Code',
      lessons: 14,
      desc: 'Master modern React from Hooks to Server Components.',
      color: 'var(--primary)',
    },
    {
      id: 2,
      title: 'Cloud Native Architecture',
      category: 'Cloud',
      lessons: 8,
      desc: 'Docker, Kubernetes, inside-out scaling patterns.',
      color: '#00fa9a',
    },
    {
      id: 3,
      title: 'Deep Learning Intro',
      category: 'Computer',
      lessons: 21,
      desc: 'PyTorch and neural networks explained simply.',
      color: '#ff2a7a',
    },
    {
      id: 4,
      title: 'Cisco CCNA Crash Course',
      category: 'Network',
      lessons: 12,
      desc: 'Routing, switching, and essential network protocols.',
      color: '#ff9900',
    },
    {
      id: 5,
      title: 'Ethical Hacking 101',
      category: 'Security',
      lessons: 15,
      desc: 'Penetration testing and finding vulnerabilities.',
      color: '#ff2a7a',
    },
    {
      id: 6,
      title: 'Python for Beginners',
      category: 'Code',
      lessons: 10,
      desc: 'Learn python syntax, basic data structures, and algorithms.',
      color: 'var(--primary)',
    },
    {
      id: 7,
      title: 'Computer Architecture',
      category: 'Computer',
      lessons: 18,
      desc: 'Understanding CPU, Memory, and basic circuit logic.',
      color: '#00fa9a',
    },
    {
      id: 8,
      title: 'TCP/IP Deep Dive',
      category: 'Network',
      lessons: 6,
      desc: 'Packets, frames, and deep networking concepts.',
      color: '#ff9900',
    }
  ];

  const filteredCourses = activeCategory === 'All' 
    ? courseData 
    : courseData.filter(course => course.category === activeCategory);

  return (
    <div className="container" style={{ paddingTop: '80px', minHeight: '80vh' }}>
      <header style={{ marginBottom: '60px', textAlign: 'center' }}>
        <h1 className="text-gradient">Short Video Courses</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto', fontSize: '1.2rem', marginTop: '16px' }}>
          Up-skill yourself with bite-sized crash courses from industry leads, hosted lightning-fast on Cloudflare R2.
        </p>

        <div style={{ marginTop: '32px', maxWidth: '600px', margin: '32px auto 0', display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {categories.map(category => (
            <button 
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`btn ${activeCategory === category ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '8px 16px', fontSize: '0.9rem' }}
            >
              {category}
            </button>
          ))}
        </div>
      </header>

      <div className="card-grid">
        {filteredCourses.map(course => (
          <div key={course.id} className="card glass-panel flex flex-col">
            <div style={{ height: '180px', background: 'var(--card-dark)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <PlayCircle size={64} color={course.color} />
              <span style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--card-dark)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', color: course.color }}>
                {course.category}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', color: course.color, fontWeight: 'bold', alignItems: 'center', marginTop: '16px' }}>
              <Award size={18} /> {course.title}
            </div>
            <p className="card-desc" style={{ marginTop: '8px' }}>{course.desc}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{course.lessons} videos</span>
              <button 
                onClick={() => { 
                  if (authLoading) return;
                  if (isGuest) navigate('/login'); 
                  else alert('Course playback feature coming soon!'); 
                }} 
                className="btn btn-primary" 
                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
              >
                Start Course
              </button>
            </div>
          </div>
        ))}
        {filteredCourses.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <Filter size={48} style={{ margin: '0 auto', marginBottom: '16px', opacity: 0.5 }} />
            <h3>No courses found for {activeCategory}</h3>
            <p>We are still working on getting content for this category!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;
