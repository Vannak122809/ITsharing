import React from 'react';
import { BookOpen, User, Calendar } from 'lucide-react';

const Experiences = () => {
  return (
    <div className="container" style={{ paddingTop: '80px', minHeight: '80vh' }}>
      <header style={{ marginBottom: '60px', textAlign: 'center' }}>
        <h1 className="text-gradient">Community Experiences</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto', fontSize: '1.2rem', marginTop: '16px' }}>
          Read career stories, technical breakdowns, and interview failures shared by fellow developers.
        </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
        
        <article className="glass-panel" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '16px' }}>How I optimized our SQL queries by 90%</h2>
          <div style={{ display: 'flex', gap: '24px', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '16px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><User size={16} /> Alexander T.</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={16} /> Oct 14, 2024</span>
          </div>
          <p style={{ color: '#e0e0e0', lineHeight: '1.8' }}>
            When our user base crossed the 1M mark, our Postgres database was screaming. We were looking at 5-second load times on the main dashboard. The culprit? An ORM query that was silently causing an N+1 problem on a very nested relationship. By implementing lateral joins and replacing the ORM...
          </p>
          <a href="#" style={{ display: 'inline-block', marginTop: '24px', fontWeight: 'bold' }}>Read Full Story &rarr;</a>
        </article>

        <article className="glass-panel" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '16px' }}>Failing the FAANG Interview: What I Learned</h2>
          <div style={{ display: 'flex', gap: '24px', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '16px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><User size={16} /> Sarah Jenkins</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={16} /> Sep 02, 2024</span>
          </div>
          <p style={{ color: '#e0e0e0', lineHeight: '1.8' }}>
            I spent 3 months grinding LeetCode, going through "Grokking the System Design Interview", and mocking. Despite all this, I bombed the behavioral rounds. I treated it like a technical test instead of a conversation. Let me share my study notes and what I'm doing differently next time...
          </p>
          <a href="#" style={{ display: 'inline-block', marginTop: '24px', fontWeight: 'bold', color: '#ff2a7a' }}>Read Full Story &rarr;</a>
        </article>

      </div>
    </div>
  );
};

export default Experiences;
