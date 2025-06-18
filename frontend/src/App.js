import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Play, Square, BarChart3, Package, DollarSign, Activity, User, LogOut, RefreshCw, Calendar, TrendingUp } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const Dashboard = () => {
  // State Management
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [currentView, setCurrentView] = useState('dashboard');
  const [robotStatus, setRobotStatus] = useState('idle');
  const [stats, setStats] = useState({
    totalParts: 0,
    todayParts: 0,
    currentCosts: 0,
    colorStats: []
  });
  const [recentParts, setRecentParts] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [profitData, setProfitData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Styles
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    },
    loginContainer: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    },
    loginBox: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      borderRadius: '20px',
      padding: '40px',
      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.2)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      width: '400px',
      maxWidth: '90vw'
    },
    input: {
      width: '100%',
      padding: '15px',
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '10px',
      color: 'white',
      fontSize: '16px',
      marginBottom: '20px',
      outline: 'none'
    },
    button: {
      width: '100%',
      padding: '15px',
      background: 'linear-gradient(45deg, #667eea, #764ba2)',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontSize: '16px',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'transform 0.2s',
    },
    mainContainer: {
      maxWidth: '1200px',
      margin: '0 auto'
    },
    nav: {
      background: 'white',
      borderRadius: '15px',
      padding: '20px',
      marginBottom: '30px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
      marginBottom: '30px'
    },
    statCard: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '30px',
      borderRadius: '15px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
      transition: 'transform 0.2s',
      cursor: 'pointer'
    },
    contentGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
      gap: '20px'
    },
    card: {
      background: 'white',
      borderRadius: '15px',
      padding: '25px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
    },
    robotButton: {
      width: '100%',
      padding: '15px',
      background: 'linear-gradient(45deg, #4ade80, #22c55e)',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontSize: '16px',
      fontWeight: 'bold',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px'
    },
    robotButtonDisabled: {
      background: '#d1d5db',
      color: '#6b7280',
      cursor: 'not-allowed'
    }
  };

  // Auth Check
  useEffect(() => {
    if (token) {
      setIsAuthenticated(true);
      fetchInitialData();
    }
  }, [token]);

  // API Calls
  const apiCall = async (endpoint, options = {}) => {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...options
    };
    
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return response.json();
  };

  const login = async (username, password) => {
    try {
      const result = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      setToken(result.token);
      localStorage.setItem('token', result.token);
      setIsAuthenticated(true);
      fetchInitialData();
    } catch (error) {
      alert('Login fehlgeschlagen: ' + error.message);
    }
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchColorStats(),
        fetchAllParts(),
        fetchTodayStats(),
        fetchTodayCosts()
      ]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchColorStats = async () => {
    try {
      const data = await apiCall('/statistics/colors');
      setStats(prev => ({ ...prev, colorStats: data }));
    } catch (error) {
      console.error('Error fetching color stats:', error);
    }
  };

  const fetchAllParts = async () => {
    try {
      const data = await apiCall('/parts/');
      setRecentParts(data.slice(-10).reverse());
      setStats(prev => ({ ...prev, totalParts: data.length }));
    } catch (error) {
      console.error('Error fetching parts:', error);
    }
  };

  const fetchTodayStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await apiCall(`/parts/day/${today}`);
      setStats(prev => ({ ...prev, todayParts: data.length }));
    } catch (error) {
      console.error('Error fetching today stats:', error);
    }
  };

  const fetchTodayCosts = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await apiCall(`/costs/${today}`);
      setStats(prev => ({ ...prev, currentCosts: data.costs || 0 }));
    } catch (error) {
      console.error('Error fetching costs:', error);
    }
  };

  const startRobot = async () => {
    try {
      setRobotStatus('running');
      setLoading(true);
      await apiCall('/robot/start');
      setRobotStatus('idle');
      await fetchInitialData();
    } catch (error) {
      setRobotStatus('error');
      alert('Roboter-Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfitTime = async (partsCount) => {
    try {
      const data = await apiCall(`/costs/preview/${partsCount}`);
      setProfitData(data);
    } catch (error) {
      console.error('Error fetching profit data:', error);
    }
  };

  // Color mapping for charts
  const colorMap = {
    red: '#ef4444',
    blue: '#3b82f6', 
    green: '#22c55e',
    yellow: '#eab308'
  };

  // Components
  const LoginForm = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = () => {
      if (username && password) {
        login(username, password);
      }
    };

    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginBox}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white', margin: '0 0 10px 0' }}>Robot Control</h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>Pick & Place System</p>
          </div>
          <div>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              style={styles.input}
            />
            <button
              onClick={handleSubmit}
              style={styles.button}
              onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  };

  const StatCard = ({ title, value, icon, subtitle }) => (
    <div 
      style={styles.statCard}
      onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
      onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ margin: '0 0 10px 0', opacity: 0.8, fontSize: '14px' }}>{title}</p>
          <p style={{ margin: '0', fontSize: '2rem', fontWeight: 'bold' }}>{value}</p>
          {subtitle && <p style={{ margin: '5px 0 0 0', opacity: 0.7, fontSize: '12px' }}>{subtitle}</p>}
        </div>
        <div style={{ opacity: 0.8 }}>
          {icon}
        </div>
      </div>
    </div>
  );

  const RobotControl = () => {
    const buttonStyle = robotStatus === 'running' || loading 
      ? { ...styles.robotButton, ...styles.robotButtonDisabled }
      : styles.robotButton;

    return (
      <div style={styles.card}>
        <h3 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={20} />
          Roboter Kontrolle
        </h3>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: robotStatus === 'running' ? '#22c55e' : robotStatus === 'error' ? '#ef4444' : '#6b7280'
            }}></div>
            <span>
              Status: {robotStatus === 'running' ? 'Läuft' : robotStatus === 'error' ? 'Fehler' : 'Bereit'}
            </span>
          </div>
          <button
            onClick={startRobot}
            disabled={robotStatus === 'running' || loading}
            style={buttonStyle}
          >
            {robotStatus === 'running' || loading ? (
              <><RefreshCw size={20} style={{animation: 'spin 1s linear infinite'}} /> Läuft...</>
            ) : (
              <><Play size={20} /> Scan & Pick Starten</>
            )}
          </button>
        </div>
      </div>
    );
  };

  const ColorDistribution = () => (
    <div style={styles.card}>
      <h3 style={{ margin: '0 0 20px 0' }}>Farbverteilung</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={stats.colorStats}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="count"
            label={({ color, count }) => `${color}: ${count}`}
          >
            {stats.colorStats.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colorMap[entry.color] || '#8884d8'} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );

  const RecentParts = () => (
    <div style={styles.card}>
      <h3 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Package size={20} />
        Letzte Bauteile
      </h3>
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {recentParts.map((part) => (
          <div key={part._id} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '15px',
            backgroundColor: '#f8fafc',
            borderRadius: '10px',
            marginBottom: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: colorMap[part.color] || '#gray'
              }}></div>
              <div>
                <span style={{ fontWeight: 'bold' }}>{part.partNumber}</span>
                <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>{part.color}</p>
              </div>
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              {new Date(part.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const ProfitOptimizer = () => {
    const [partsCount, setPartsCount] = useState(10);

    return (
      <div style={styles.card}>
        <h3 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TrendingUp size={20} />
          Gewinn-Optimierung
        </h3>
        <div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
              Anzahl zu produzierende Teile:
            </label>
            <input
              type="number"
              value={partsCount}
              onChange={(e) => setPartsCount(parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                outline: 'none'
              }}
              min="1"
              max="500"
            />
          </div>
          <button
            onClick={() => fetchProfitTime(partsCount)}
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(45deg, #3b82f6, #1d4ed8)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Optimale Zeit berechnen
          </button>
          {profitData && (
            <div style={{
              marginTop: '20px',
              padding: '15px',
              backgroundColor: '#f0fdf4',
              borderRadius: '8px',
              border: '1px solid #bbf7d0'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#166534' }}>Beste Produktionszeit:</h4>
              <p style={{ margin: 0, fontSize: '14px', color: '#166534' }}>
                Start: {new Date(profitData.startTimestamp).toLocaleString()}<br/>
                Ende: {new Date(profitData.endTimestamp).toLocaleString()}<br/>
                Geschätzte Kosten: €{profitData.totalPrice?.toFixed(4)}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const Navigation = () => (
    <div style={styles.nav}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Projekt Messestand - David, Jonas, Tim</h1>
        <div style={{ display: 'flex', gap: '15px' }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setCurrentView(id)}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: currentView === id ? '#dbeafe' : 'transparent',
                color: currentView === id ? '#1d4ed8' : '#6b7280'
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={logout}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 15px',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: '#6b7280'
        }}
      >
        <LogOut size={16} />
        Logout
      </button>
    </div>
  );

  const DashboardView = () => (
    <div>
      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <StatCard
          title="Teile Gesamt"
          value={stats.totalParts}
          icon={<Package size={32} />}
        />
        <StatCard
          title="Heute Produziert"
          value={stats.todayParts}
          icon={<Calendar size={32} />}
        />
        <StatCard
          title="Aktuelle Kosten"
          value={`€${stats.currentCosts.toFixed(4)}`}
          icon={<DollarSign size={32} />}
          subtitle="Heute"
        />
        <StatCard
          title="System Status"
          value={robotStatus === 'running' ? 'Aktiv' : 'Bereit'}
          icon={<Activity size={32} />}
        />
      </div>

      {/* Main Content Grid */}
      <div style={styles.contentGrid}>
        <RobotControl />
        <ColorDistribution />
        <RecentParts />
        <ProfitOptimizer />
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.mainContainer}>
        <Navigation />
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <RefreshCw size={32} style={{animation: 'spin 1s linear infinite'}} />
            <p style={{ color: 'white', marginTop: '10px' }}>Lade Daten...</p>
          </div>
        )}
        <DashboardView />
      </div>
    </div>
  );
};

export default Dashboard;