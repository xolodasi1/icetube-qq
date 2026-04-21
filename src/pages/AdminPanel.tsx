import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { databases } from '../lib/appwrite';
import { ShieldCheck, ShieldAlert, Users, Video, Activity, MoreHorizontal, Ban } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export default function AdminPanel() {
  const { user, isLoading } = useAuth();
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [isDbLoading, setIsDbLoading] = useState(true);

  useEffect(() => {
    const fetchAppwriteUsers = async () => {
      try {
        const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
        const colId = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;
        
        if (!dbId || !colId) {
          setIsDbLoading(false);
          return;
        }

        const response = await databases.listDocuments(dbId, colId);
        setDbUsers(response.documents);
      } catch (error) {
        console.warn("Could not fetch Users from Appwrite DB (check IDs and Permissions). Falling back to mock data.");
      } finally {
        setIsDbLoading(false);
      }
    };

    fetchAppwriteUsers();
  }, []);

  if (isLoading) {
    return <div className="flex p-10 justify-center text-slate-400">Verifying access...</div>;
  }

  // Admin Verification Gate
  if (!user || user.email !== 'xolodtop889@gmail.com') {
    return (
      <div className="flex flex-col items-center justify-center p-10 mt-10 text-center">
        <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-slate-400 max-w-md">
          This area is strictly for Icetube network administrators. 
          Your email ({user?.email || 'Unauthorized'}) does not have the required permissions.
        </p>
      </div>
    );
  }

  // Fallback Mock Data
  const mockUsersList = [
    { id: user.$id || 'admin_id_001', name: user.name || 'Admin', email: user.email, role: 'Super Admin', joined: 'Today', status: 'Active' },
    { id: 'usr_abc123', name: 'IceExplorer', email: 'explorer@example.com', role: 'User', joined: 'Apr 20, 2026', status: 'Active' },
    { id: 'usr_def456', name: 'FrostByte22', email: 'frost22@gaming.io', role: 'Content Creator', joined: 'Apr 15, 2026', status: 'Active' },
    { id: 'usr_ghi789', name: 'Snowboarder99', email: 'snow99@mail.com', role: 'User', joined: 'Apr 10, 2026', status: 'Banned' },
    { id: 'usr_jkl012', name: 'Tech Penguin', email: 'tech@penguin.net', role: 'Moderator', joined: 'Mar 28, 2026', status: 'Active' },
  ];

  const displayUsers = dbUsers.length > 0 ? dbUsers : mockUsersList;

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full px-4 sm:px-0 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b ice-border pb-6 mt-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#70d6ff]/10 rounded-lg border border-[#70d6ff]/20">
            <ShieldCheck className="w-6 h-6 text-[#70d6ff]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white font-display">Command Center</h1>
            <p className="text-sm text-slate-400">Welcome back, Administrator</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg border border-green-500/20 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
          Servers Online
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 border ice-border p-5 rounded-xl flex flex-col relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-slate-400 text-sm font-medium">Total Accounts</span>
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <span className="text-3xl font-bold text-white relative z-10">14,248</span>
          <span className="text-xs text-green-400 mt-2 relative z-10">+124 this week</span>
          <div className="absolute right-0 bottom-0 opacity-0 group-hover:opacity-10 scale-150 transition-all duration-500">
            <Users className="w-24 h-24 text-blue-400" />
          </div>
        </div>

        <div className="bg-white/5 border ice-border p-5 rounded-xl flex flex-col relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-slate-400 text-sm font-medium">Total Videos</span>
            <Video className="w-5 h-5 text-purple-400" />
          </div>
          <span className="text-3xl font-bold text-white relative z-10">8,593</span>
          <span className="text-xs text-green-400 mt-2 relative z-10">+42 today</span>
          <div className="absolute right-0 bottom-0 opacity-0 group-hover:opacity-10 scale-150 transition-all duration-500">
            <Video className="w-24 h-24 text-purple-400" />
          </div>
        </div>

        <div className="bg-white/5 border ice-border p-5 rounded-xl flex flex-col relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-slate-400 text-sm font-medium">Active Streams</span>
            <Activity className="w-5 h-5 text-red-400" />
          </div>
          <span className="text-3xl font-bold text-white relative z-10">12</span>
          <span className="text-xs text-slate-500 mt-2 relative z-10">Currently Live</span>
          <div className="absolute right-0 bottom-0 opacity-0 group-hover:opacity-10 scale-150 transition-all duration-500">
            <Activity className="w-24 h-24 text-red-400" />
          </div>
        </div>

        <div className="bg-[#70d6ff]/5 border border-[#70d6ff]/20 p-5 rounded-xl flex flex-col">
          <h3 className="text-slate-200 text-sm font-medium mb-3">System Health</h3>
          <div className="flex flex-col gap-3">
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Database Load</span>
                <span>42%</span>
              </div>
              <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#70d6ff] h-1.5 rounded-full" style={{ width: '42%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Storage</span>
                <span>86%</span>
              </div>
              <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '86%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white/5 border ice-border rounded-xl overflow-hidden mt-4">
        <div className="p-5 border-b ice-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white">Registered Users Map</h2>
            <p className="text-xs text-slate-400 mt-0.5">Note: Client SDK shows local/synced sample. Real full list requires Appwrite Server API.</p>
          </div>
          <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border ice-border rounded-lg text-sm transition-colors text-slate-200 whitespace-nowrap">
            Export CSV
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-black/20 text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium">User Details</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(112,214,255,0.05)] text-slate-300">
              {displayUsers.map((usr) => (
                <tr key={usr.id || usr.$id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {((usr.firstName || usr.name) || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-200">
                          {usr.firstName ? `${usr.firstName} ${usr.lastName || ''}`.trim() : (usr.name || 'Unknown')}
                        </span>
                        <span className="text-xs text-slate-500">{usr.email || 'No email'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs border ${
                      (usr.userRole || usr.role || 'User') === 'Super Admin' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                      (usr.userRole || usr.role || 'User') === 'Moderator' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                      (usr.userRole || usr.role || 'User') === 'Content Creator' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                      'bg-slate-500/10 border-slate-500/20 text-slate-400'
                    }`}>
                      {usr.userRole || usr.role || 'User'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400">{usr.joined || new Date(usr.$createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    {(usr.status || 'Active') === 'Active' ? (
                      <span className="flex items-center gap-1.5 text-green-400 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-red-400 text-xs">
                        <Ban className="w-3 h-3" /> Banned
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right border-0">
                    <button className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 border-0 outline-none">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
