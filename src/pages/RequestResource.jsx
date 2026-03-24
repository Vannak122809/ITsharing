import React, { useState } from 'react';
import { Send, CheckCircle } from 'lucide-react';

const RequestResource = () => {
  const [type, setType] = useState('software');
  const [name, setName] = useState('');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    // In a real app, this would send to Firebase or an API API
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setName('');
      setDetails('');
    }, 3000);
  };

  return (
    <div className="container" style={{ paddingTop: '80px', minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '600px', borderRadius: '16px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '16px' }} className="text-gradient">Request Resource</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '32px' }}>
          Can't find the software or document you need? Let us know and we'll add it!
        </p>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#00fa9a' }}>
            <CheckCircle size={64} style={{ margin: '0 auto 16px auto' }} />
            <h3>Request Submitted!</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>We will review and add this resource shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-main)' }}>Resource Type</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--surface-border)', background: 'var(--card-dark)', color: 'var(--text-main)', outline: 'none' }}
              >
                <option value="software">Software / Application</option>
                <option value="document">Document / Book</option>
                <option value="course">Course / Tutorial</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-main)' }}>Resource Name <span style={{ color: '#ff2a7a' }}>*</span></label>
              <input 
                type="text" 
                required
                placeholder="e.g. Adobe Premiere Pro 2024" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--surface-border)', background: 'var(--card-dark)', color: 'var(--text-main)', outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-main)' }}>Additional Details (Optional)</label>
              <textarea 
                placeholder="Specific version, language, or OS requirements..." 
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                style={{ width: '100%', padding: '12px', minHeight: '100px', borderRadius: '8px', border: '1px solid var(--surface-border)', background: 'var(--card-dark)', color: 'var(--text-main)', resize: 'vertical', outline: 'none' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}>
              <Send size={18} /> Submit Request
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default RequestResource;
