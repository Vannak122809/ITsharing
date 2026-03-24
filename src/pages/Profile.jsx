import React from 'react';
import { User, BookOpen, DownloadCloud, Settings, Heart } from 'lucide-react';

const Profile = ({ user }) => {
  return (
    <div className="container" style={{ paddingTop: '80px', minHeight: '80vh' }}>
      <div className="glass-panel" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', borderRadius: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '40px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '32px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff' }}>
            <User size={40} />
          </div>
          <div>
            <h1 className="text-gradient" style={{ marginBottom: '8px' }}>User Profile</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>{user ? user.email : 'Loading...'}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
          <div className="card-dark" style={{ padding: '24px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
            <Heart size={24} color="#ff2a7a" style={{ marginBottom: '16px' }} />
            <h3 style={{ marginBottom: '8px', color: 'var(--text-main)' }}>Saved Resources</h3>
            <p style={{ color: 'var(--text-muted)' }}>14 Items saved</p>
          </div>
          <div className="card-dark" style={{ padding: '24px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
            <DownloadCloud size={24} color="var(--primary)" style={{ marginBottom: '16px' }} />
            <h3 style={{ marginBottom: '8px', color: 'var(--text-main)' }}>Downloads</h3>
            <p style={{ color: 'var(--text-muted)' }}>45 Downloads history</p>
          </div>
          <div className="card-dark" style={{ padding: '24px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
            <BookOpen size={24} color="#00fa9a" style={{ marginBottom: '16px' }} />
            <h3 style={{ marginBottom: '8px', color: 'var(--text-main)' }}>Courses</h3>
            <p style={{ color: 'var(--text-muted)' }}>3 In Progress</p>
          </div>
          <div className="card-dark" style={{ padding: '24px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
            <Settings size={24} color="#ff9900" style={{ marginBottom: '16px' }} />
            <h3 style={{ marginBottom: '8px', color: 'var(--text-main)' }}>Account Settings</h3>
            <p style={{ color: 'var(--text-muted)' }}>Manage your password</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
