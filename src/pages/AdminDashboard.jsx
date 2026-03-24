import React from 'react';
import { Activity, Users, FileText, Database, PackagePlus, AlertCircle } from 'lucide-react';

const AdminDashboard = () => {
  return (
    <div className="container" style={{ paddingTop: '80px', minHeight: '80vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
        <div>
          <h1 className="text-gradient">Admin Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage site resources, users, and content dynamically.</p>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PackagePlus size={18} /> Add New Resource
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
          <div style={{ padding: '16px', background: 'rgba(69, 243, 255, 0.1)', borderRadius: '12px', color: 'var(--primary)' }}><Users size={28} /></div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.8rem' }}>1,245</h2>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total Users</span>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
          <div style={{ padding: '16px', background: 'rgba(0, 250, 154, 0.1)', borderRadius: '12px', color: '#00fa9a' }}><Database size={28} /></div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.8rem' }}>342</h2>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Software Items</span>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
          <div style={{ padding: '16px', background: 'rgba(255, 42, 122, 0.1)', borderRadius: '12px', color: '#ff2a7a' }}><FileText size={28} /></div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.8rem' }}>89</h2>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Documents</span>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
          <div style={{ padding: '16px', background: 'rgba(255, 153, 0, 0.1)', borderRadius: '12px', color: '#ff9900' }}><AlertCircle size={28} /></div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.8rem' }}>12</h2>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Pending Requests</span>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
        <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }} className="text-gradient">
          <Activity size={20} /> Recent Site Activity
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-main)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--surface-border)', textAlign: 'left', color: 'var(--text-muted)' }}>
              <th style={{ padding: '12px' }}>Action</th>
              <th style={{ padding: '12px' }}>User</th>
              <th style={{ padding: '12px' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <td style={{ padding: '12px' }}>Downloaded Windows 11 ISO</td>
              <td style={{ padding: '12px' }}>john.doe@gmail.com</td>
              <td style={{ padding: '12px' }}>2 mins ago</td>
            </tr>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <td style={{ padding: '12px' }}>Requested "Final Cut Pro"</td>
              <td style={{ padding: '12px' }}>sarah99@yahoo.com</td>
              <td style={{ padding: '12px' }}>1 hour ago</td>
            </tr>
            <tr>
              <td style={{ padding: '12px' }}>Added new post in Community</td>
              <td style={{ padding: '12px' }}>TechStudent99</td>
              <td style={{ padding: '12px' }}>3 hours ago</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
