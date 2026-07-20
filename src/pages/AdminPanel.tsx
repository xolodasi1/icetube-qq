import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../lib/AuthContext';
import { databases } from '../lib/appwrite';
import { 
  ShieldCheck, ShieldAlert, Users, Video, Activity, MoreHorizontal, 
  Ban, Trash2, Clock, Eye, AlertTriangle, 
  LayoutDashboard, PieChart, BarChart3, ArrowLeft, Loader2,
  ChevronRight, Calendar, Bell, Search, Filter, Film, Scissors
} from 'lucide-react';
import { Navigate, Link } from 'react-router-dom';
import { useLanguage } from '../lib/LanguageContext';
import { Query, ID } from 'appwrite';

type AdminTab = 'dashboard' | 'analytics' | 'users' | 'reports' | 'content';

export default function AdminPanel() {
  const { user, profile, isLoading: isAuthLoading } = useAuth();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [dbVideos, setDbVideos] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [errorDetails, setErrorDetails] = useState<{message: string, collection: string} | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setErrorDetails(null);
      
      const refreshIcon = document.getElementById('admin-refresh-icon');
      if (refreshIcon) refreshIcon.classList.add('animate-spin');

      const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
      const usersColId = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;
      const reportsColId = import.meta.env.VITE_APPWRITE_REPORTS_COLLECTION_ID;
      const videosColId = import.meta.env.VITE_APPWRITE_VIDEOS_COLLECTION_ID;

      if (!dbId) {
        setErrorDetails({ message: "Database ID missing in .env", collection: "Global Config" });
        setIsLoading(false);
        return;
      }

      try {
        // Fetch Users (Profiles)
        if (usersColId) {
          try {
            const response = await databases.listDocuments(dbId, usersColId, [Query.limit(100)]);
            
            // Deduplicate users by userId
            const seenUsers = new Set();
            const dedupedUsers = response.documents.filter((doc: any) => {
              if (seenUsers.has(doc.userId)) return false;
              seenUsers.add(doc.userId);
              return true;
            });

            setDbUsers(dedupedUsers.map((doc: any) => ({
              $id: doc.$id,
              userId: doc.userId,
              name: doc.name || doc.displayName || 'Anonymous',
              avatar: doc.avatar || doc.photoUrl,
              email: doc.email,
              role: doc.role || 'user',
              verified: doc.verified || false,
              verificationRequested: doc.verificationRequested || false,
              subscribersCount: doc.subscribersCount,
              likesCount: doc.likesCount,
              viewsCount: doc.viewsCount,
              videosCount: doc.videosCount,
              snowflakesCount: doc.snowflakesCount
            })));
          } catch (err: any) {
            console.error("Users Fetch Error:", err);
            setErrorDetails({ message: err.message, collection: "Users/Profiles" });
          }
        }

        // Fetch Reports
        if (reportsColId) {
          try {
            const response = await databases.listDocuments(dbId, reportsColId, [Query.limit(100)]);
            setReports(response.documents.map((doc: any) => ({
              $id: doc.$id,
              videoId: doc.videoId,
              videoTitle: doc.videoTitle || 'Unknown',
              reason: doc.reason,
              userId: doc.userId,
              reporterName: doc.reporterName || doc.reporterName?.[0] || 'Anonymous',
              timestamp: doc.$createdAt
            })));
          } catch (err: any) {
            console.warn("Reports Fetch Error:", err);
          }
        }

        // Fetch Videos
        if (videosColId) {
          try {
            const response = await databases.listDocuments(dbId, videosColId, [Query.limit(100)]);
            setDbVideos(response.documents.map((doc: any) => ({
              $id: doc.$id,
              title: doc.title,
              uploaderId: doc.uploaderId,
              uploaderName: doc.uploaderName,
              views: doc.views || 0,
              contentType: doc.contentType,
              isShort: doc.isShort,
              isShorts: doc.isShorts,
              verified: doc.verified || false,
            })));
          } catch (err: any) {
            console.error("Videos Fetch Error:", err);
            if (!errorDetails) setErrorDetails({ message: err.message, collection: "Videos" });
          }
        }
      } catch (err: any) {
        console.error("General Admin Panel Error:", err);
        setErrorDetails({ message: err.message, collection: "Database Connection" });
      } finally {
        setIsLoading(false);
        if (refreshIcon) refreshIcon.classList.remove('animate-spin');
      }
    };

    fetchData();

    window.addEventListener('refreshAdminData', fetchData);
    return () => window.removeEventListener('refreshAdminData', fetchData);
  }, []);

  const stats = useMemo(() => {
    const shorts = dbVideos.filter(v => v.isShort || v.isShorts).length;
    const regularVideos = dbVideos.length - shorts;
    
    // Calculate leaderboards
    const leaderboards = {
      subscribers: [...dbUsers].map(u => ({ $id: u.$id, name: u.name, avatar: u.avatar, subscribersCount: u.subscribersCount || 0 })).sort((a, b) => (b.subscribersCount || 0) - (a.subscribersCount || 0)).slice(0, 5),
      likes: [...dbUsers].map(u => ({ $id: u.$id, name: u.name, avatar: u.avatar, likesCount: u.likesCount || 0 })).sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0)).slice(0, 5),
      views: [...dbUsers].map(u => ({ $id: u.$id, name: u.name, avatar: u.avatar, viewsCount: u.viewsCount || 0 })).sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0)).slice(0, 5),
      videos: [...dbUsers].map(u => ({ $id: u.$id, name: u.name, avatar: u.avatar, videosCount: u.videosCount || 0 })).sort((a, b) => (b.videosCount || 0) - (a.videosCount || 0)).slice(0, 5),
      snowflakes: [...dbUsers].map(u => ({ $id: u.$id, name: u.name, avatar: u.avatar, snowflakesCount: u.snowflakesCount || 0 })).sort((a, b) => (b.snowflakesCount || 0) - (a.snowflakesCount || 0)).slice(0, 5),
    };
    
    return {
      totalUsers: dbUsers.length,
      totalVideos: regularVideos,
      totalShorts: shorts,
      totalReports: reports.length,
      growth: '+12%',
      serverStatus: 'Online',
      uptime: '99.98%',
      leaderboards
    };
  }, [dbUsers, dbVideos, reports]);

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#70d6ff] animate-spin" />
      </div>
    );
  }

  if (!user || (!['admin', 'moderator', 'proprietor'].includes(profile?.role || '') && user.email !== 'xolodtop889@gmail.com')) {
    return (
      <div className="flex flex-col items-center justify-center p-10 mt-10 text-center">
        <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-slate-400 max-w-md">
          {language === 'ru' 
            ? `Эта зона строго для администраторов Icetube. Ваш email (${user?.email || 'Неизвестно'}) не имеет прав доступа.`
            : `This area is strictly for Icetube network administrators. Your email (${user?.email || 'Unauthorized'}) does not have the required permissions.`}
        </p>
        <Link to="/" className="mt-8 px-6 py-2 bg-white/5 border ice-border rounded-xl text-slate-300 hover:bg-white/10 transition-all flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          {language === 'ru' ? 'Вернуться домой' : 'Back to Home'}
        </Link>
      </div>
    );
  }

  const SidebarItem = ({ id, label, icon: Icon }: { id: AdminTab, label: string, icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all relative group ${
        activeTab === id 
          ? 'bg-[#70d6ff]/10 text-[#70d6ff] border border-[#70d6ff]/20' 
          : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
      }`}
    >
      <Icon className={`w-5 h-5 ${activeTab === id ? 'text-[#70d6ff]' : 'text-slate-500 group-hover:text-slate-300'}`} />
      <span className="truncate">{label}</span>
      {activeTab === id && (
         <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#70d6ff] rounded-r-full shadow-[0_0_10px_rgba(112,214,255,0.5)]" />
      )}
    </button>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-120px)] bg-[#0a0f1e]/50 rounded-3xl overflow-hidden border ice-border mb-10 mx-4 sm:mx-0">
      <aside className="w-full md:w-64 bg-black/20 border-r ice-border flex flex-col p-4 gap-2 shrink-0">
        <div className="p-4 mb-4 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-[#70d6ff] to-blue-600 rounded-xl shadow-lg shadow-[#70d6ff]/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-white font-black uppercase text-sm block tracking-tighter">Icetube</span>
            <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest">Admin Panel</span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <SidebarItem id="dashboard" label={language === 'ru' ? 'Дашборд' : 'Dashboard'} icon={LayoutDashboard} />
          <SidebarItem id="analytics" label={language === 'ru' ? 'Аналитика' : 'Analytics'} icon={BarChart3} />
          <SidebarItem id="users" label={language === 'ru' ? 'Пользователи' : 'Users'} icon={Users} />
          <SidebarItem id="reports" label={language === 'ru' ? 'Жалобы' : 'Reports'} icon={ShieldAlert} />
          <SidebarItem id="content" label={language === 'ru' ? 'Контент' : 'Content'} icon={Video} />
        </div>

        <div className="mt-6 px-4">
           <button 
             onClick={() => {
                const event = new Event('refreshAdminData');
                window.dispatchEvent(event);
             }}
             className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#70d6ff] hover:bg-[#70d6ff]/10 transition-all active:scale-95"
           >
             <Loader2 className="w-3 h-3" id="admin-refresh-icon" />
             {language === 'ru' ? 'Обновить' : 'Refresh'}
           </button>
        </div>

        <div className="mt-auto pt-6 border-t border-white/5 p-4">
           <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-[#70d6ff] text-xs font-bold transition-all group">
             <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
             {language === 'ru' ? 'На главную' : 'Exit to Site'}
           </Link>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-gradient-to-br from-transparent to-[#70d6ff]/[0.02]">
        {errorDetails && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4">
            <div className="p-2 bg-red-500/20 rounded-xl mt-1">
               <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-red-400 font-black uppercase text-xs tracking-widest">{errorDetails.collection} Error</h3>
              <p className="text-red-200/70 text-sm mt-1">{errorDetails.message}</p>
              <p className="text-[10px] text-red-400/50 mt-2 italic">Check Appwrite Console for correct collection IDs and permissions.</p>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <header>
              <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Command Center</h1>
              <p className="text-slate-400 text-sm mt-1">Real-time infrastructure and community oversight</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title={language === 'ru' ? 'Пользователи' : 'Total Users'} value={stats.totalUsers} icon={Users} color="text-blue-400" bgColor="bg-blue-400/10" />
              <StatCard title={language === 'ru' ? 'Видео' : 'Total Videos'} value={stats.totalVideos} icon={Video} color="text-purple-400" bgColor="bg-purple-400/10" />
              <StatCard title={language === 'ru' ? 'Шортсы' : 'Total Shorts'} value={stats.totalShorts} icon={Activity} color="text-teal-400" bgColor="bg-teal-400/10" />
              <StatCard title={language === 'ru' ? 'Жалобы' : 'Pending Reports'} value={stats.totalReports} icon={ShieldAlert} color="text-red-400" bgColor="bg-red-400/10" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white/[0.02] border ice-border rounded-2xl p-6">
                 <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                   <Activity className="w-5 h-5 text-[#70d6ff]" />
                   {language === 'ru' ? 'Последняя активность' : 'Recent Activity'}
                 </h2>
                 <div className="space-y-4 text-center py-10 text-slate-500">
                    <Clock className="w-8 h-8 mx-auto opacity-20 mb-2" />
                    <p className="text-xs font-bold uppercase tracking-widest">{language === 'ru' ? 'Логи активности отключены' : 'Activity logs offline'}</p>
                 </div>
              </div>

              <div className="bg-white/[0.02] border ice-border rounded-2xl p-6">
                 <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                   <Bell className="w-5 h-5 text-orange-400" />
                   {language === 'ru' ? 'Система' : 'System'}
                 </h2>
                 <div className="space-y-3">
                   <div className="flex justify-between text-sm"><span className="text-slate-400">{language === 'ru' ? 'Статус' : 'Status'}</span><span className="text-green-400 font-bold">{language === 'ru' ? 'Онлайн' : 'Online'}</span></div>
                   <div className="flex justify-between text-sm"><span className="text-slate-400">{language === 'ru' ? 'Версия' : 'Version'}</span><span className="text-white font-bold">2.0</span></div>
                   <div className="flex justify-between text-sm"><span className="text-slate-400">Uptime</span><span className="text-white font-bold">99.98%</span></div>
                   <div className="flex justify-between text-sm"><span className="text-slate-400">{language === 'ru' ? 'База' : 'Database'}</span><span className="text-[#70d6ff] font-bold">Appwrite</span></div>
                 </div>
                 <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
                    <div className="flex items-center gap-3 text-orange-400 mb-2">
                       <AlertTriangle className="w-4 h-4" />
                       <span className="text-xs font-bold uppercase">{language === 'ru' ? 'Latency' : 'Latency'}</span>
                    </div>
                    <p className="text-orange-200/60 text-sm">{language === 'ru' ? 'Большие файлы могут загружаться дольше' : 'Large media uploads may experience higher latency'}</p>
                 </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <header className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Site Analytics</h1>
                <p className="text-slate-400 text-sm mt-1">Data-driven insights into Icetube growth</p>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/5 border ice-border rounded-xl text-xs font-bold text-slate-300">
                <Calendar className="w-4 h-4" />
                All Time
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="md:col-span-2 bg-white/[0.02] border ice-border rounded-3xl p-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                     <BarChart3 className="w-32 h-32 text-[#70d6ff]" />
                  </div>
                  <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Registration Base</h3>
                  <div className="flex items-end gap-3 mb-8">
                     <span className="text-5xl font-black text-white tracking-tighter">{stats.totalUsers}</span>
                     <span className="text-sm font-bold text-green-400 mb-2">Users Enrolled</span>
                  </div>
                  
                  <div className="flex items-end justify-between h-40 gap-2">
                    {[30, 45, 25, 60, 40, 80, 55, 70, 90, 45, 30, 65].map((h, i) => (
                      <div 
                        key={i} 
                        className="flex-1 bg-[#70d6ff]/20 hover:bg-[#70d6ff] transition-all rounded-t-lg relative group/bar"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-4 text-[10px] text-slate-500 font-black uppercase tracking-widest px-1">
                     <span>Jan</span>
                     <span>Jun</span>
                     <span>Dec</span>
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="bg-white/[0.02] border ice-border rounded-3xl p-6">
                     <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Content Distribution</h4>
                     <div className="space-y-4">
                        <div className="space-y-1.5">
                           <div className="flex justify-between text-xs">
                              <span className="text-slate-300 font-bold">Videos</span>
                              <span className="text-white">{stats.totalVideos}</span>
                           </div>
                           <div className="w-full bg-black/40 rounded-full h-2">
                              <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${(stats.totalVideos / Math.max(1, stats.totalVideos + stats.totalShorts)) * 100}%` }}></div>
                           </div>
                        </div>
                        <div className="space-y-1.5">
                           <div className="flex justify-between text-xs">
                              <span className="text-slate-300 font-bold">Shorts</span>
                              <span className="text-white">{stats.totalShorts}</span>
                           </div>
                           <div className="w-full bg-black/40 rounded-full h-2">
                              <div className="bg-teal-400 h-2 rounded-full" style={{ width: `${(stats.totalShorts / Math.max(1, stats.totalVideos + stats.totalShorts)) * 100}%` }}></div>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="bg-[#70d6ff]/5 border border-[#70d6ff]/20 rounded-3xl p-6">
                     <h4 className="text-[#70d6ff] text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Bell className="w-3 h-3" />
                        {language === 'ru' ? 'Обновление платформы' : 'Platform Update'}
                      </h4>
                      <p className="text-[#70d6ff]/80 text-xs font-medium leading-relaxed">
                         {language === 'ru' ? 'Icetube 2.0 развёрнут. Улучшено отслеживание снежинок и синхронизация лидербордов.' : 'Icetube 2.0 deployment complete. Enhanced snowflake tracking and leaderboard syncing enabled.'}
                     </p>
                  </div>
               </div>
            </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
               <MetricSquare label={language === 'ru' ? 'Всего просмотров' : 'Total Views'} value="Live" change="+4.2%" trend="up" />
               <MetricSquare label={language === 'ru' ? 'Жалобы' : 'Reports'} value={stats.totalReports} change="Managed" trend="up" />
               <MetricSquare label={language === 'ru' ? 'Сред. сессия' : 'Avg Session'} value="--m" change="+0.8%" trend="up" />
               <MetricSquare label={language === 'ru' ? 'Сеть' : 'Network'} value="Cloud" change="Active" trend="up" />
            </div>

            <div className="bg-white/[0.02] border ice-border rounded-3xl p-6 overflow-hidden">
               <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white uppercase italic tracking-tighter">{language === 'ru' ? 'Лидеры (Топ создатели)' : 'Leaderboards (Top Creators)'}</h2>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">{language === 'ru' ? 'На основе текущего состояния БД' : 'Based on current database state'}</div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  <LeaderboardColumn title={language === 'ru' ? 'По подписчикам' : 'By Subscribers'} icon={Users} data={stats.leaderboards.subscribers} metric="subscribersCount" />
                  <LeaderboardColumn title={language === 'ru' ? 'По лайкам' : 'By Likes'} icon={ShieldCheck} data={stats.leaderboards.likes} metric="likesCount" />
                  <LeaderboardColumn title={language === 'ru' ? 'По просмотрам' : 'By Views'} icon={Eye} data={stats.leaderboards.views} metric="viewsCount" />
                  <LeaderboardColumn title={language === 'ru' ? 'По контенту' : 'By Content'} icon={Video} data={stats.leaderboards.videos} metric="videosCount" />
                  <LeaderboardColumn title={language === 'ru' ? 'По снежинкам' : 'By Snowflakes'} icon={Activity} data={stats.leaderboards.snowflakes} metric="snowflakesCount" />
               </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && <UsersSection dbUsers={dbUsers} t={t} language={language} />}
        {activeTab === 'reports' && <ReportsSection reports={reports} t={t} language={language} setReports={setReports} />}
        {activeTab === 'content' && <ContentSection dbVideos={dbVideos} language={language} t={t} setDbVideos={setDbVideos} />}
      </main>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bgColor }: any) {
  return (
    <div className="bg-white/5 border ice-border p-5 rounded-2xl hover:border-white/10 transition-all group overflow-hidden relative">
      <div className="flex items-center justify-between mb-2 relative z-10">
        <span className="text-slate-400 text-xs font-black uppercase tracking-widest">{title}</span>
        <div className={`p-2 ${bgColor} rounded-xl`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <div className="flex items-baseline gap-2 relative z-10">
        <span className="text-2xl font-black text-white">{value}</span>
      </div>
      <Icon className={`absolute -right-4 -bottom-4 w-24 h-24 ${color} opacity-[0.03] group-hover:opacity-10 transition-all duration-500 scale-150 rotate-12`} />
    </div>
  );
}

function MetricSquare({ label, value, change, trend }: any) {
  return (
    <div className="bg-white/[0.02] border ice-border p-5 rounded-2xl">
       <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest block mb-1">{label}</span>
       <div className="flex items-center justify-between">
          <span className="text-xl font-black text-white">{value}</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${trend === 'up' ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
             {change}
          </span>
       </div>
    </div>
  );
}

function LeaderboardColumn({ title, icon: Icon, data, metric }: any) {
  return (
    <div className="bg-black/20 border ice-border rounded-2xl p-4 flex flex-col gap-4">
      <div className="flex items-center gap-2 border-b ice-border pb-3">
         <Icon className="w-4 h-4 text-[#70d6ff]" />
         <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{title}</span>
      </div>
      <div className="space-y-3">
        {data.length === 0 ? (
          <div className="py-8 text-center text-[10px] text-slate-600 font-bold uppercase">No data</div>
        ) : data.map((usr: any, i: number) => (
          <div key={usr.$id} className="flex items-center justify-between group">
            <div className="flex items-center gap-2 min-w-0">
               <span className="text-[10px] font-black text-slate-600 w-4 italic">#{i+1}</span>
               <img 
                 src={usr.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(usr.name || 'U')}&background=random`} 
                 className="w-6 h-6 rounded-full border border-white/10 shrink-0" 
                 alt=""
               />
               <span className="text-xs font-bold text-slate-300 truncate group-hover:text-white transition-colors">{usr.name || 'Anonymous'}</span>
            </div>
            <span className="text-xs font-black text-[#70d6ff]">{usr[metric] || 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function UsersSection({ dbUsers, t, language }: any) {
  const { user, profile } = useAuth();
  const isProprietor = user?.email === 'xolodtop889@gmail.com' || profile?.role === 'proprietor';
  const isAdmin = isProprietor || profile?.role === 'admin';
  const [localUsers, setLocalUsers] = useState(dbUsers);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLocalUsers(dbUsers);
  }, [dbUsers]);

  const filteredUsers = localUsers.filter((u: any) =>
    !searchQuery || u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.userId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const changeUserRole = async (userId: string, newRole: string) => {
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const usersColId = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;
    if (!dbId || !usersColId) return;

    try {
      await databases.updateDocument(dbId, usersColId, userId, { role: newRole });
      setLocalUsers(localUsers.map((u: any) => u.$id === userId ? { ...u, role: newRole } : u));
    } catch (err: any) {
      console.error("Failed to update user role:", err);
      alert("Failed to update user role. Please ensure you have added a string attribute named 'role' to your 'users' collection in Appwrite.");
    }
  };

  const toggleVerification = async (userId: string, verified: boolean) => {
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const usersColId = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;
    if (!dbId || !usersColId) return;

    try {
      await databases.updateDocument(dbId, usersColId, userId, { verified, verificationRequested: false });
      setLocalUsers(localUsers.map((u: any) => u.$id === userId ? { ...u, verified, verificationRequested: false } : u));
    } catch (err: any) {
      console.error("Failed to toggle verification:", err);
      alert("Failed to update verification status. Add a boolean attribute named 'verified' to your users collection in Appwrite.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase italic tracking-tighter">{language === 'ru' ? 'Зарегистрированные создатели' : 'Registered Creators'}</h1>
          <p className="text-sm text-slate-400">{language === 'ru' ? `Всего: ${dbUsers.length} профилей` : `Total base: ${dbUsers.length} profiles`}</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder={language === 'ru' ? 'Поиск пользователей...' : 'Search users...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#70d6ff] w-64"
          />
        </div>
      </div>

      <div className="bg-white/5 border ice-border rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-black/20 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b ice-border">
              <tr>
                <th className="px-6 py-4">Profile</th>
                <th className="px-6 py-4">Role / Permissions</th>
                <th className="px-6 py-4">Registered At</th>
                <th className="px-6 py-4 text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-20 text-slate-500 text-xs font-bold uppercase tracking-widest">{language === 'ru' ? 'Ничего не найдено' : 'Nothing found'}</td></tr>
              ) : filteredUsers.map((usr: any) => (
                <tr key={usr.$id} className="hover:bg-white/5 transition-all group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={usr.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(usr.name || 'U')}&background=random`} 
                        className="w-10 h-10 rounded-full border border-white/10 shrink-0" 
                        alt=""
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-white truncate">{usr.name || 'Unnamed'}</span>
                        <span className="text-[10px] text-slate-500 font-mono tracking-tighter truncate">UID: {usr.userId}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 bg-white/5 border border-white/5 text-[10px] font-black uppercase rounded ${usr.email === 'xolodtop889@gmail.com' ? 'text-purple-400 border-purple-400/20' : usr.role === 'admin' ? 'text-red-400 border-red-400/20' : usr.role === 'moderator' ? 'text-yellow-400 border-yellow-400/20' : 'text-slate-400'}`}>
                        {usr.email === 'xolodtop889@gmail.com' ? 'Proprietor' : (usr.role || 'user')}
                      </span>
                      {usr.verificationRequested && !usr.verified && (
                        <span className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[9px] font-black uppercase rounded">
                          Req Verify
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-500">
                     {new Date(usr.$createdAt || Date.now()).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
            {isAdmin && usr.email !== 'xolodtop889@gmail.com' ? (
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => toggleVerification(usr.$id, !usr.verified)}
                  className={`p-1.5 rounded-lg transition-all text-[10px] font-bold flex items-center gap-1 ${
                    usr.verified
                      ? 'bg-[#70d6ff]/10 text-[#70d6ff] border border-[#70d6ff]/20'
                      : 'bg-slate-500/10 text-slate-400 border border-transparent hover:border-white/10'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {usr.verified ? 'Verified' : 'Verify'}
                </button>
                <select 
                  value={usr.role || 'user'}
                  onChange={(e) => changeUserRole(usr.$id, e.target.value)}
                  className="bg-black/50 border border-white/10 text-xs rounded-lg p-2 text-slate-300 focus:outline-none focus:border-[#70d6ff]"
                >
                   <option value="user">User</option>
                   <option value="moderator">Moderator</option>
                   {isProprietor && <option value="admin">Admin</option>}
                </select>
              </div>
            ) : (
                        <button className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-400 hidden">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                     )}
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

function ReportsSection({ reports, t, language, setReports }: any) {
  const [dismissing, setDismissing] = useState<string | null>(null);

  const handleDismissReport = async (reportId: string) => {
    if (!window.confirm(language === 'ru' ? 'Закрыть жалобу?' : 'Dismiss this report?')) return;
    setDismissing(reportId);
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const reportsColId = import.meta.env.VITE_APPWRITE_REPORTS_COLLECTION_ID;
    if (!dbId || !reportsColId) { setDismissing(null); return; }
    try {
      await databases.deleteDocument(dbId, reportsColId, reportId);
      setReports(reports.filter((r: any) => r.$id !== reportId));
    } catch (err) {
      console.error("Delete report failed:", err);
    } finally {
      setDismissing(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase italic tracking-tighter">Content Integrity</h1>
          <p className="text-sm text-slate-400">{language === 'ru' ? 'Всего жалоб' : 'Total Flags'}: {reports.length}</p>
        </div>
        {reports.length > 0 && (
          <span className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase rounded-full">{reports.length} active</span>
        )}
      </div>

      <div className="bg-white/5 border ice-border rounded-2xl overflow-hidden">
        {reports.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center text-center">
             <ShieldCheck className="w-16 h-16 text-green-500/20 mb-4" />
             <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">{language === 'ru' ? 'Нет нарушений' : 'No pending violations'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-black/20 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b ice-border">
                <tr>
                  <th className="px-6 py-4">{language === 'ru' ? 'Доказательство' : 'Evidence'}</th>
                  <th className="px-6 py-4">{language === 'ru' ? 'Тип' : 'Type'}</th>
                  <th className="px-6 py-4">{language === 'ru' ? 'Автор' : 'Reporter'}</th>
                  <th className="px-6 py-4 text-right">{language === 'ru' ? 'Действия' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-500/5 text-slate-300">
                {reports.map((report: any) => (
                  <tr key={report.$id} className="hover:bg-red-500/[0.03] transition-all group">
                    <td className="px-6 py-4">
                      <Link to={`/watch/${report.videoId}`} className="flex items-center gap-3">
                         <div className="w-12 h-8 bg-black rounded border border-white/10 flex items-center justify-center">
                            <Eye className="w-3 h-3 text-slate-600" />
                         </div>
                         <span className="text-white font-bold text-xs truncate max-w-[160px]">{report.videoTitle || 'Flagged Content'}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                       <span className="px-2 py-1 bg-red-500/10 text-red-500 rounded text-[10px] font-black uppercase border border-red-500/10">
                          {report.reason || 'Unknown'}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[9px] font-bold text-slate-400">
                           {(report.reporterName || 'A')[0]}
                         </div>
                         <span className="text-[10px] text-slate-400 font-bold truncate max-w-[100px]">{report.reporterName || 'Anonymous'}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button 
                         onClick={() => handleDismissReport(report.$id)} 
                         disabled={dismissing === report.$id}
                         className="p-2 hover:bg-green-500/10 text-green-400 rounded-xl transition-all disabled:opacity-30"
                       >
                         {dismissing === report.$id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ContentSection({ dbVideos, language, t, setDbVideos }: any) {
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [contentTab, setContentTab] = useState<'videos' | 'shorts'>('videos');

  const videos = dbVideos.filter((v: any) => v.contentType !== 'shorts' && !v.isShort && !v.isShorts);
  const shorts = dbVideos.filter((v: any) => v.contentType === 'shorts' || v.isShort || v.isShorts);
  const currentList = contentTab === 'videos' ? videos : shorts;

  const handleDeleteVideo = async (videoId: string) => {
    if (!window.confirm(language === 'ru' ? 'Удалить это видео навсегда?' : 'Delete this video permanently?')) return;
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const videosColId = import.meta.env.VITE_APPWRITE_VIDEOS_COLLECTION_ID;
    if (!dbId || !videosColId) return;
    try {
      await databases.deleteDocument(dbId, videosColId, videoId);
      setDbVideos(dbVideos.filter((v: any) => v.$id !== videoId));
    } catch (err: any) {
      console.error("Delete video failed:", err);
      alert("Failed to delete: " + err.message);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedVideos.size === 0) return;
    if (!window.confirm(language === 'ru' ? `Удалить ${selectedVideos.size} видео?` : `Delete ${selectedVideos.size} videos?`)) return;
    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const videosColId = import.meta.env.VITE_APPWRITE_VIDEOS_COLLECTION_ID;
    if (!dbId || !videosColId) return;
    for (const id of selectedVideos) {
      try {
        await databases.deleteDocument(dbId, videosColId, id);
      } catch (err) {
        console.error("Failed to delete video", id, err);
      }
    }
    setDbVideos(dbVideos.filter((v: any) => !selectedVideos.has(v.$id)));
    setSelectedVideos(new Set());
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedVideos);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedVideos(next);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase italic tracking-tighter">
            {language === 'ru' ? 'Управление контентом' : 'Content Management'}
          </h1>
          <p className="text-sm text-slate-400">
            {language === 'ru' ? `Всего: ${dbVideos.length}` : `${dbVideos.length} total`}
          </p>
        </div>
        {selectedVideos.size > 0 && (
          <button
            onClick={handleDeleteSelected}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/30 transition-all text-xs font-bold"
          >
            <Trash2 className="w-4 h-4" />
            {language === 'ru' ? `Удалить (${selectedVideos.size})` : `Delete (${selectedVideos.size})`}
          </button>
        )}
      </div>

      {/* Videos / Shorts Tabs */}
      <div className="flex items-center gap-4 border-b border-white/5 pb-1">
        <button
          onClick={() => { setContentTab('videos'); setSelectedVideos(new Set()); }}
          className={`flex items-center gap-2 pb-3 font-bold text-sm transition-all relative ${contentTab === 'videos' ? 'text-[#70d6ff]' : 'text-slate-400 hover:text-white'}`}
        >
          <Film className="w-4 h-4" />
          {language === 'ru' ? 'Видео' : 'Videos'}
          <span className="text-[10px] opacity-60">({videos.length})</span>
          {contentTab === 'videos' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#70d6ff] rounded-full" />}
        </button>
        <button
          onClick={() => { setContentTab('shorts'); setSelectedVideos(new Set()); }}
          className={`flex items-center gap-2 pb-3 font-bold text-sm transition-all relative ${contentTab === 'shorts' ? 'text-[#70d6ff]' : 'text-slate-400 hover:text-white'}`}
        >
          <Scissors className="w-4 h-4" />
          Shorts
          <span className="text-[10px] opacity-60">({shorts.length})</span>
          {contentTab === 'shorts' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#70d6ff] rounded-full" />}
        </button>
      </div>

      <div className="bg-white/5 border ice-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/20 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b ice-border">
              <tr>
                <th className="px-4 py-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedVideos.size === currentList.length && currentList.length > 0}
                    onChange={() => {
                      if (selectedVideos.size === currentList.length) setSelectedVideos(new Set());
                      else setSelectedVideos(new Set(currentList.map((v: any) => v.$id)));
                    }}
                    className="accent-[#70d6ff]"
                  />
                </th>
                <th className="px-4 py-4">{language === 'ru' ? 'Название' : 'Title'}</th>
                <th className="px-4 py-4">{language === 'ru' ? 'Автор' : 'Author'}</th>
                <th className="px-4 py-4">{language === 'ru' ? 'Тип' : 'Type'}</th>
                <th className="px-4 py-4 text-right">{language === 'ru' ? 'Просмотры' : 'Views'}</th>
                <th className="px-4 py-4 text-right">{language === 'ru' ? 'Действия' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {currentList.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-20 text-slate-500 text-xs font-bold uppercase tracking-widest">
                  {language === 'ru' ? 'Нет контента' : 'No content'}
                </td></tr>
              ) : currentList.map((v: any) => (
                <tr key={v.$id} className="hover:bg-white/5 transition-all">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selectedVideos.has(v.$id)} onChange={() => toggleSelect(v.$id)} className="accent-[#70d6ff]" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-7 bg-black rounded border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                        <Eye className="w-3 h-3 text-slate-600" />
                      </div>
                      <span className="text-white font-bold text-sm truncate max-w-[200px]">{v.title || (language === 'ru' ? 'Без названия' : 'Untitled')}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{v.uploaderName || v.uploaderId?.slice(0, 8) || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded ${v.contentType === 'shorts' || v.isShort ? 'text-teal-400 bg-teal-400/10' : 'text-purple-400 bg-purple-400/10'}`}>
                      {v.contentType === 'shorts' || v.isShort ? 'Short' : 'Video'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-mono text-slate-400">{v.views || 0}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDeleteVideo(v.$id)} className="p-2 hover:bg-red-500/10 text-red-400 rounded-xl transition-all">
                      <Trash2 className="w-4 h-4" />
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
