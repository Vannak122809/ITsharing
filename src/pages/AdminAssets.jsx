import React, { useState, useEffect } from 'react';
import { 
    LayoutDashboard, Plus, Search, Filter, 
    MoreHorizontal, Download, Eye, Trash2,
    Calendar, Tag, Layers, CheckCircle2,
    Clock, TrendingUp, Users, Package,
    Image as ImageIcon, X, FileText, AlertCircle,
    UserCircle, ShieldCheck, Database, Globe, UserCog, ShieldAlert
} from 'lucide-react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import AssetUploadForm from '../components/AssetUploadForm';

const AdminAssets = () => {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [activeTab, setActiveTab] = useState('assets'); // 'assets' or 'users'
    const [assets, setAssets] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [userSearchQuery, setUserSearchQuery] = useState('');
    
    const SUPER_ADMIN_EMAIL = 'seunvannak33047@gmail.com';
    const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;
    const isAdmin = userProfile?.role === 'admin' || isSuperAdmin;

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                try {
                    const { getUserProfile, syncUserToFirestore } = await import('../userService');
                    // Sync current user first to ensure they exist
                    const profile = await syncUserToFirestore(currentUser);
                    setUserProfile(profile);
                } catch (err) {
                    console.error("Auth sync error:", err);
                }
            }
        });

        // Sync Assets
        const qAssets = query(collection(db, 'assets'), orderBy('createdAt', 'desc'));
        const unsubscribeAssets = onSnapshot(qAssets, (snapshot) => {
            setAssets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // Sync Users (Only if super admin)
        let unsubscribeUsers = () => {};
        if (isSuperAdmin) {
            const qUsers = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
            unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
                const users = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    email: doc.data().email || 'No Email',
                    nickname: doc.data().nickname || 'New User'
                }));
                setUsersList(users);
            });
        }

        return () => {
            unsubscribeAuth();
            unsubscribeAssets();
            unsubscribeUsers();
        };
    }, [isSuperAdmin]);

    const handleDeleteAsset = async (id) => {
        if (window.confirm('Are you sure you want to delete this asset?')) {
            try {
                await deleteDoc(doc(db, 'assets', id));
            } catch (error) {
                console.error('Delete failed:', error);
            }
        }
    };

    const handleUpdateUserRole = async (uid, newRole) => {
        try {
            const userRef = doc(db, 'users', uid);
            await updateDoc(userRef, { 
                role: newRole, 
                updatedAt: serverTimestamp() 
            });
            alert(`Success: User role updated to ${newRole}`);
        } catch (error) {
            console.error('Update role failed:', error);
            alert(`Error: ${error.message}. Please check your Firebase Security Rules.`);
        }
    };

    if (!isAdmin) {
        return (
            <div className="denied-full-premium">
                <div className="security-core-wrap">
                    <div className="security-glow" />
                    <div className="shield-artistic-wrap">
                        <div className="shield-ring" />
                        <div className="shield-main-glass">
                            <ShieldAlert size={80} className="shield-flicker" />
                        </div>
                    </div>
                    <div className="security-text-content">
                        <span className="security-badge">Access Level: Unauthorized</span>
                        <h1>Security Protocol Active</h1>
                        <p>This administrative sector is encrypted. Only the verified platform owner holds the master key to these systems.</p>
                        <div className="action-row-security">
                            <button onClick={() => window.location.href = '/'} className="btn-ghost-cyan">
                                Return to Terminal
                            </button>
                            <button onClick={() => window.location.href = '/login'} className="btn-primary-cyan">
                                Authentication Required
                            </button>
                        </div>
                    </div>
                </div>
                
                <style dangerouslySetInnerHTML={{ __html: `
                    .denied-full-premium { min-height: 100vh; background: #05070a; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative; font-family: 'Inter', sans-serif; }
                    .security-core-wrap { position: relative; z-index: 10; text-align: center; max-width: 600px; padding: 40px; }
                    
                    .security-glow { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 300px; height: 300px; background: radial-gradient(circle, rgba(255, 77, 77, 0.15) 0%, transparent 70%); filter: blur(60px); pointer-events: none; }
                    
                    .shield-artistic-wrap { position: relative; margin: 0 auto 48px; width: 220px; height: 220px; display: flex; align-items: center; justify-content: center; }
                    .shield-ring { position: absolute; inset: 0; border: 2px dashed rgba(255, 77, 77, 0.2); border-radius: 50%; animation: spin-slow 12s linear infinite; }
                    .shield-main-glass { width: 140px; height: 140px; background: rgba(255, 77, 77, 0.05); backdrop-filter: blur(20px); border: 1px solid rgba(255, 77, 77, 0.3); border-radius: 40px; display: flex; align-items: center; justify-content: center; color: #ff4d4d; box-shadow: 0 20px 40px rgba(255, 77, 77, 0.1), inset 0 0 20px rgba(255, 77, 77, 0.1); transform: rotate(15deg); animation: float-shield 4s ease-in-out infinite; }
                    
                    .shield-flicker { animation: flicker 2s linear infinite; }
                    
                    .security-text-content h1 { font-size: 2.8rem; font-weight: 900; color: white; margin-bottom: 20px; letter-spacing: -0.04em; }
                    .security-text-content p { color: #8e95a1; line-height: 1.6; font-size: 1.1rem; margin-bottom: 40px; }
                    
                    .security-badge { background: rgba(255, 77, 77, 0.1); color: #ff4d4d; padding: 6px 16px; border-radius: 40px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; border: 1px solid rgba(255, 77, 77, 0.2); margin-bottom: 24px; display: inline-block; }
                    
                    .action-row-security { display: flex; gap: 16px; justify-content: center; }
                    .btn-primary-cyan { background: #ff4d4d; color: white; border: none; padding: 16px 32px; border-radius: 14px; font-weight: 800; font-size: 1rem; cursor: pointer; transition: 0.3s; box-shadow: 0 10px 30px rgba(255, 77, 77, 0.3); }
                    .btn-primary-cyan:hover { transform: translateY(-3px); box-shadow: 0 15px 40px rgba(255, 77, 77, 0.5); }
                    
                    .btn-ghost-cyan { background: transparent; color: #8e95a1; border: 1px solid rgba(255, 255, 255, 0.1); padding: 16px 32px; border-radius: 14px; font-weight: 800; cursor: pointer; transition: 0.3s; }
                    .btn-ghost-cyan:hover { background: rgba(255, 255, 255, 0.05); color: white; border-color: white; }
                    
                    @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                    @keyframes float-shield { 0%, 100% { transform: rotate(15deg) translateY(0); } 50% { transform: rotate(18deg) translateY(-15px); } }
                    @keyframes flicker { 0%, 100% { opacity: 1; } 95% { opacity: 0.8; } 98% { opacity: 0.4; } }
                `}} />
            </div>
        );
    }

    const filteredAssets = assets.filter(a => a.title?.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredUsers = usersList.filter(u => u.email?.toLowerCase().includes(userSearchQuery.toLowerCase()));

    return (
        <div className="unified-admin-page">
            <aside className="admin-sidebar glass-panel">
                <div className="sidebar-brand">
                    <div className="b-icon">IT</div>
                    <span>Manage Pro</span>
                </div>
                <nav className="side-nav">
                    <button className={activeTab === 'assets' ? 'active' : ''} onClick={() => setActiveTab('assets')}>
                        <Package size={20} /> Assets Library
                    </button>
                    {isSuperAdmin && (
                        <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>
                            <Users size={20} /> Team Members
                        </button>
                    )}
                    <button onClick={() => window.location.href = '/'}>
                        <Globe size={20} /> Exit to Site
                    </button>
                </nav>
                <div className="sidebar-footer">
                    <div className="admin-status">
                        <div className="pulse" /> Super Admin Active
                    </div>
                </div>
            </aside>

            <main className="admin-content">
                <header className="content-header">
                    <div className="h-text">
                        <h1>{activeTab === 'assets' ? 'Assets Management' : 'User Governance'}</h1>
                        <p>Real-time control center for ITSharing ecosystem</p>
                    </div>
                    {activeTab === 'assets' && (
                        <button className="btn-upload-new" onClick={() => setIsUploadModalOpen(true)}>
                            <Plus size={20} /> Publish New Asset
                        </button>
                    )}
                </header>

                <div className="stats-row">
                    <div className="stat-pill">
                        <Package size={16} /> <strong>{assets.length}</strong> Assets
                    </div>
                    <div className="stat-pill">
                        <UserCircle size={16} /> <strong>{usersList.length}</strong> Members
                    </div>
                    <div className="stat-pill">
                        <ShieldCheck size={16} /> <strong>{usersList.filter(u => u.role === 'admin').length}</strong> Admins
                    </div>
                </div>

                {activeTab === 'assets' ? (
                    <div className="table-wrapper glass-panel">
                        <div className="table-controls">
                            <div className="search-bar">
                                <Search size={18} />
                                <input type="text" placeholder="Search resources..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            </div>
                        </div>
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Asset Preview</th>
                                    <th>Category & Format</th>
                                    <th>Collection</th>
                                    <th>Date Added</th>
                                    <th>Management</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAssets.map(asset => (
                                    <tr key={asset.id}>
                                        <td>
                                            <div className="asset-cell">
                                                <div className="a-preview"><img src={asset.url} alt="" /></div>
                                                <div className="a-info">
                                                    <strong>{asset.title}</strong>
                                                    <span>{asset.size} • {asset.dimensions}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge-type ${asset.category}`}>{asset.format} • {asset.category}</span>
                                        </td>
                                        <td><span className="badge-collection">{asset.collection || 'General'}</span></td>
                                        <td><div className="date-cell"><Calendar size={12} /> {asset.createdAt?.toDate().toLocaleDateString()}</div></td>
                                        <td>
                                            <div className="action-btns">
                                                <button className="btn-icon" title="View"><Eye size={16} /></button>
                                                <button className="btn-icon delete" onClick={() => handleDeleteAsset(asset.id)} title="Delete"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="table-wrapper glass-panel">
                        <div className="table-controls">
                            <div className="search-bar">
                                <Search size={18} />
                                <input type="text" placeholder="Search users by identity..." value={userSearchQuery} onChange={(e) => setUserSearchQuery(e.target.value)} />
                            </div>
                        </div>
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Member Details</th>
                                    <th>Current Access</th>
                                    <th>Engagement</th>
                                    <th>Assign Role</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(user => (
                                    <tr key={user.id} className={user.email === SUPER_ADMIN_EMAIL ? 'highlight-row' : ''}>
                                        <td>
                                            <div className="user-cell">
                                                <div className="u-avatar">
                                                    {user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : <UserCircle size={24} />}
                                                </div>
                                                <div className="u-info">
                                                    <strong>{user.nickname || 'Unknown'}</strong>
                                                    <span>{user.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge-role ${user.role}`}>
                                                {user.role === 'admin' ? <ShieldCheck size={12} /> : <UserCircle size={12} />}
                                                {user.role}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="date-cell"><Clock size={12} /> Seen: {user.lastLoginAt?.toDate().toLocaleDateString() || 'N/A'}</div>
                                        </td>
                                        <td>
                                            {user.email !== SUPER_ADMIN_EMAIL ? (
                                                <select value={user.role} onChange={(e) => handleUpdateUserRole(user.id, e.target.value)} className="role-dropdown">
                                                    <option value="user">User Access</option>
                                                    <option value="admin">Admin Access</option>
                                                </select>
                                            ) : <span className="badge-owner">Platform Owner</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {isUploadModalOpen && (
                <div className="upload-modal-overlay">
                    <div className="modal-inner">
                        <button className="close-modal" onClick={() => setIsUploadModalOpen(false)}><X size={24} /></button>
                        <AssetUploadForm onComplete={() => setIsUploadModalOpen(false)} />
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{ __html: `
                .unified-admin-page { display: flex; min-height: 100vh; background: #f8f9fc; }
                .admin-sidebar { width: 280px; background: white; border-right: 1px solid #edf2f7; padding: 40px 24px; display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh; }
                .sidebar-brand { display: flex; align-items: center; gap: 12px; margin-bottom: 48px; }
                .b-icon { background: #5c67ff; color: white; width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 900; }
                .sidebar-brand span { font-size: 1.1rem; font-weight: 800; color: #1a1a1a; }
                
                .side-nav { display: flex; flex-direction: column; gap: 8px; flex: 1; }
                .side-nav button { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 14px; border: none; background: transparent; color: #718096; font-weight: 600; cursor: pointer; transition: 0.3s; text-align: left; }
                .side-nav button.active { background: #5c67ff; color: white; box-shadow: 0 10px 20px rgba(92,103,255,0.2); }
                .side-nav button:hover:not(.active) { background: #f7fafc; color: #1a1a1a; }

                .sidebar-footer { border-top: 1px solid #edf2f7; padding-top: 24px; }
                .admin-status { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: 800; color: #10b981; background: #f0fdf4; padding: 12px; border-radius: 12px; }
                .pulse { width: 8px; height: 8px; border-radius: 50%; background: #10b981; animation: pulse 2s infinite; }
                @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); } 70% { box-shadow: 0 0 0 10px rgba(16,185,129,0); } 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); } }

                .admin-content { flex: 1; padding: 48px; max-width: 1400px; margin: 0 auto; width: 100%; }
                .content-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
                .h-text h1 { font-size: 2rem; font-weight: 900; color: #1a1a1a; margin-bottom: 4px; }
                .h-text p { color: #718096; font-size: 1rem; }
                .btn-upload-new { background: #1a1a1a; color: white; border: none; padding: 14px 24px; border-radius: 16px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: 0.3s; box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
                .btn-upload-new:hover { transform: translateY(-2px); box-shadow: 0 15px 30px rgba(0,0,0,0.15); }

                .stats-row { display: flex; gap: 16px; margin-bottom: 32px; }
                .stat-pill { background: white; padding: 8px 16px; border-radius: 12px; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; border: 1px solid #edf2f7; color: #4a5568; }
                .stat-pill strong { color: #1a1a1a; }

                .table-wrapper { background: white; border-radius: 28px; padding: 0; overflow: hidden; border: 1px solid #edf2f7; box-shadow: 0 4px 20px rgba(0,0,0,0.02); }
                .table-controls { padding: 24px; border-bottom: 1px solid #edf2f7; display: flex; justify-content: space-between; }
                .search-bar { display: flex; align-items: center; gap: 12px; background: #f7fafc; padding: 12px 20px; border-radius: 14px; width: 400px; }
                .search-bar input { border: none; background: transparent; outline: none; width: 100%; font-weight: 600; font-size: 0.95rem; }

                .modern-table { width: 100%; border-collapse: collapse; text-align: left; }
                .modern-table th { padding: 20px 24px; background: #fafbfc; font-size: 0.75rem; font-weight: 800; color: #718096; text-transform: uppercase; border-bottom: 1px solid #edf2f7; }
                .modern-table td { padding: 20px 24px; border-bottom: 1px solid #f7fafc; }
                
                .asset-cell, .user-cell { display: flex; align-items: center; gap: 16px; }
                .a-preview, .u-avatar { width: 50px; height: 50px; border-radius: 12px; overflow: hidden; background: #edf2f7; display: flex; align-items: center; justify-content: center; }
                .a-preview img, .u-avatar img { width: 100%; height: 100%; object-fit: cover; }
                .a-info strong, .u-info strong { display: block; font-size: 1rem; color: #1a1a1a; }
                .a-info span, .u-info span { font-size: 0.8rem; color: #718096; }

                .badge-type, .badge-collection, .badge-role { padding: 6px 14px; border-radius: 8px; font-size: 0.75rem; font-weight: 800; display: inline-flex; align-items: center; gap: 6px; }
                .badge-role.admin { background: #fff4eb; color: #e67e22; }
                .badge-role.user { background: #f0fdf4; color: #10b981; }
                .badge-owner { font-size: 0.75rem; font-weight: 800; color: #5c67ff; background: #f0f1ff; padding: 6px 12px; border-radius: 8px; }
                .date-cell { font-size: 0.85rem; color: #718096; display: flex; align-items: center; gap: 6px; }
                
                .action-btns { display: flex; gap: 8px; }
                .btn-icon { width: 36px; height: 36px; border-radius: 10px; border: 1px solid #edf2f7; background: white; cursor: pointer; color: #718096; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
                .btn-icon:hover { background: #f7fafc; color: #5c67ff; border-color: #5c67ff; }
                .btn-icon.delete:hover { background: #fff5f5; color: #e53e3e; border-color: #e53e3e; }
                
                .role-dropdown { padding: 8px 12px; border-radius: 10px; border: 1px solid #edf2f7; font-weight: 700; color: #4a5568; outline: none; cursor: pointer; }

                .upload-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); z-index: 5000; display: flex; align-items: center; justify-content: center; padding: 40px; }
                .modal-inner { background: white; border-radius: 40px; width: 100%; max-width: 1000px; position: relative; max-height: 90vh; overflow-y: auto; }
                .close-modal { position: absolute; top: 24px; right: 24px; background: white; border: none; cursor: pointer; color: #718096; z-index: 10; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }

                .denied-full { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 24px; background: white; }
                .denied-full h1 { font-size: 2.5rem; font-weight: 900; }
                .denied-full p { color: #718096; max-width: 400px; }
            `}} />
        </div>
    );
};

export default AdminAssets;
