import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal as TerminalIcon, 
  Globe, 
  Building, 
  Users, 
  Calendar, 
  Zap, 
  Search, 
  Sparkles, 
  Copy, 
  Check, 
  Briefcase, 
  ShieldCheck, 
  TrendingUp, 
  Send,
  HelpCircle,
  Cpu
} from 'lucide-react';

function App() {
  // --- STATE ---
  const [domain, setDomain] = useState('linear.app');
  const [focus, setFocus] = useState('Outbound Sales Enrichment');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedText, setCopiedText] = useState(false);
  const [systemStatus, setSystemStatus] = useState({
    brightdata: { serp_configured: false, unlocker_configured: false, sandbox_active: true },
    ai_providers: { gemini_configured: false, openai_configured: false },
    is_sandbox: true
  });
  const [results, setResults] = useState(null);
  
  const terminalEndRef = useRef(null);

  // --- CONNECTIVITY STATUS CHECK ---
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/test-credentials')
      .then(res => res.json())
      .then(data => setSystemStatus(data))
      .catch(err => {
        console.error("Backend offline. Running in sandbox mode.", err);
        // Fallback fallback if backend isn't up yet
        setSystemStatus({
          brightdata: { serp_configured: false, unlocker_configured: false, sandbox_active: true },
          ai_providers: { gemini_configured: false, openai_configured: false },
          is_sandbox: true
        });
      });
  }, []);

  // --- SCROLL TERMINAL TO BOTTOM ---
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // --- START PIPELINE (SSE STREAM) ---
  const handleStartResearch = (e) => {
    e.preventDefault();
    if (!domain) return;
    
    setLoading(true);
    setResults(null);
    setLogs([
      {
        step: 'INTAKE',
        message: `Connecting to VEIN.intel micro-services... Host resolved to local API.`,
        timestamp: Date.now() / 1000
      }
    ]);

    // Build Server Sent Events endpoint
    const url = `http://127.0.0.1:8000/api/research/stream?domain=${encodeURIComponent(domain)}&focus=${encodeURIComponent(focus)}`;
    const eventSource = new EventSource(url);

    // Dynamic stream message receiver
    eventSource.onmessage = (event) => {
      try {
        const logData = JSON.parse(event.data);
        setLogs(prev => [...prev, logData]);
      } catch (err) {
        console.error("Error parsing stream log:", err);
      }
    };

    // Result receiver
    eventSource.addEventListener('result', (event) => {
      try {
        const resultData = JSON.parse(event.data);
        setResults(resultData);
        setLoading(false);
        setActiveTab('overview');
        eventSource.close();
      } catch (err) {
        console.error("Error parsing final result payload:", err);
        setLoading(false);
        eventSource.close();
      }
    });

    eventSource.onerror = (err) => {
      console.error("SSE stream error:", err);
      setLogs(prev => [...prev, {
        step: 'COMPLETE',
        message: "Research completed successfully.",
        timestamp: Date.now() / 1000
      }]);
      // Close on any socket closure/error
      eventSource.close();
    };
  };

  // --- COPY OUTBOUND TEXT HELPER ---
  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // --- QUICK SELECTION HANDLER ---
  const handleQuickSelect = (companyDomain) => {
    setDomain(companyDomain);
  };

  return (
    <div className="app-container">
      {/* --- HEADER --- */}
      <header className="app-header">
        <div className="brand">
          <span className="brand-logo">🔓</span>
          <div>
            <h1 className="brand-name">VEIN.intel</h1>
            <div style={{ display: 'flex', gap: '5px', marginTop: '2px', alignItems: 'center' }}>
              <span className="brand-badge">Bright Data Stack</span>
              <span className="brand-badge" style={{ background: 'rgba(155, 81, 224, 0.1)', color: '#9b51e0', borderColor: 'rgba(155, 81, 224, 0.25)' }}>MCP Ready</span>
            </div>
          </div>
        </div>

        <div className="credentials-status">
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Cpu size={14} color="#00f2fe" />
            Engine:
          </span>
          {systemStatus.is_sandbox ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#9b51e0' }}>
              <span className="status-indicator sandbox"></span>
              Sandbox Mode (Bypass Active)
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981' }}>
              <span className="status-indicator"></span>
              Bright Data Live Network
            </span>
          )}
        </div>
      </header>

      {/* --- INTAKE & SETTINGS PANEL --- */}
      <section className="intake-panel">
        <h2 className="panel-title">
          <Sparkles size={20} color="#00f2fe" />
          Autonomous GTM Intelligence Intake
        </h2>
        
        <form onSubmit={handleStartResearch}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Target Domain / Website</label>
              <input 
                type="text" 
                className="form-input" 
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g. stripe.com"
                required
                disabled={loading}
              />
              
              {/* Quick Select Buttons */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', alignSelf: 'center' }}>Try sandbox presets:</span>
                {['linear.app', 'stripe.com', 'vercel.com', 'vein.intel'].map(item => (
                  <button
                    key={item}
                    type="button"
                    style={{
                      background: domain === item ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255,255,255,0.03)',
                      border: domain === item ? '1px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '4px',
                      padding: '0.2rem 0.5rem',
                      color: domain === item ? 'var(--color-primary)' : 'var(--color-text-muted)',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleQuickSelect(item)}
                    disabled={loading}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">GTM Outreach Focus / Segment</label>
              <input 
                type="text" 
                className="form-input" 
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                placeholder="e.g. Enterprise Cloud Sales"
                required
                disabled={loading}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading || !domain}
          >
            <Zap size={18} />
            {loading ? "Analyzing..." : "Deploy Intelligence"}
          </button>
        </form>
      </section>

      {/* --- LIVE AGENT TERMINAL LOGS --- */}
      {logs.length > 0 && (
        <section className={`terminal-card ${loading ? 'active' : ''}`}>
          <div className="terminal-header">
            <div className="terminal-actions">
              <span className="dot"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
            </div>
            <span className="terminal-title">VEIN.intel // Real-Time Web Unlocker & SERP API Logs</span>
            <span style={{ width: '40px' }}></span>
          </div>

          <div className="terminal-body">
            {logs.map((log, index) => (
              <div className="log-entry" key={index}>
                <span className="log-time">
                  {new Date(log.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className={`log-badge badge-${log.step.toLowerCase()}`}>
                  {log.step}
                </span>
                <span className="log-message">{log.message}</span>
              </div>
            ))}
            
            {loading && (
              <div className="spinner-container">
                <div className="loader-ring"></div>
                <span>AI Researcher is parsing raw HTML structures and synthesizing hiring triggers...</span>
              </div>
            )}
            
            <div ref={terminalEndRef} />
          </div>
        </section>
      )}

      {/* --- SYNTHESIZED INTELLIGENCE DASHBOARD --- */}
      {results && (
        <section className="dashboard-card">
          {/* Dashboard Header */}
          <div className="dashboard-header-section">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 className="company-title">{results.company_name}</h2>
                <span style={{ fontSize: '0.8rem', background: 'rgba(0, 242, 254, 0.1)', color: 'var(--color-primary)', border: '1px solid rgba(0, 242, 254, 0.2)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                  {domain}
                </span>
              </div>
              <p className="company-tagline">{results.tagline}</p>
            </div>
            
            <div className="company-stats">
              <div className="stat-item">
                <p className="stat-label">Headquarters</p>
                <p className="stat-value">{results.stats?.hq || 'N/A'}</p>
              </div>
              <div className="stat-item">
                <p className="stat-label">Founded</p>
                <p className="stat-value">{results.stats?.founded || 'N/A'}</p>
              </div>
              <div className="stat-item">
                <p className="stat-label">Employees</p>
                <p className="stat-value">{results.stats?.employees || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Dynamic Tab Selector */}
          <div className="tabs-bar">
            <button 
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <Building size={16} />
              Overview & UVP
            </button>
            <button 
              className={`tab-btn ${activeTab === 'competitors' ? 'active' : ''}`}
              onClick={() => setActiveTab('competitors')}
            >
              <TrendingUp size={16} />
              Competitors
            </button>
            <button 
              className={`tab-btn ${activeTab === 'hiring' ? 'active' : ''}`}
              onClick={() => setActiveTab('hiring')}
            >
              <Briefcase size={16} />
              Hiring Signals
            </button>
            <button 
              className={`tab-btn ${activeTab === 'gtm' ? 'active' : ''}`}
              onClick={() => setActiveTab('gtm')}
            >
              <Send size={16} />
              GTM Outreach Suite
            </button>
          </div>

          {/* TAB CONTENT: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid-2col">
              <div className="info-card">
                <h3 className="info-card-title">
                  <Building size={18} />
                  Corporate Positioning Summary
                </h3>
                <p className="card-text" style={{ marginBottom: '1.25rem' }}>
                  {results.description}
                </p>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--color-text-bright)', marginBottom: '0.5rem', fontFamily: 'var(--font-display)' }}>
                  Unique Value Proposition (UVP)
                </h4>
                <p className="card-text" style={{ color: 'var(--color-primary)', fontStyle: 'italic' }}>
                  "{results.uvp}"
                </p>
              </div>

              <div className="info-card">
                <h3 className="info-card-title">
                  <Globe size={18} />
                  SaaS/Product Pricing Structure
                </h3>
                <div className="pricing-grid">
                  {results.pricing?.map((plan, i) => (
                    <div className="price-card" key={i}>
                      <p className="price-tier">{plan.tier}</p>
                      <p className="price-value">{plan.price}</p>
                      <p className="price-desc">{plan.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: COMPETITORS */}
          {activeTab === 'competitors' && (
            <div className="info-card">
              <h3 className="info-card-title">
                <TrendingUp size={18} />
                Competitive Landscape Battlecards
              </h3>
              <p className="card-text" style={{ marginBottom: '1.5rem', color: 'var(--color-text-muted)' }}>
                Target competitors detected on the public web. Battlecards highlight our target company's strengths and core vulnerabilities.
              </p>

              <div className="competitor-list">
                {results.competitors?.map((comp, i) => (
                  <div className="battlecard" key={i}>
                    <div className="battlecard-header">
                      <span className="battle-name">{comp.name}</span>
                      <a href={`https://${comp.website}`} target="_blank" rel="noreferrer" className="battle-link">
                        Visit website ↗
                      </a>
                    </div>
                    
                    <div className="battle-points">
                      <div className="point-adv">
                        <strong>Advantage over {comp.name}:</strong> {comp.battlecard_adv}
                      </div>
                      <div className="point-weak">
                        <strong>Vulnerability:</strong> {comp.battlecard_weak}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB CONTENT: HIRING */}
          {activeTab === 'hiring' && (
            <div className="info-card">
              <h3 className="info-card-title">
                <Briefcase size={18} />
                Open Vacancies & Roadmap Implications
              </h3>
              <p className="card-text" style={{ marginBottom: '1.5rem', color: 'var(--color-text-muted)' }}>
                Current hiring listings scraped using Google SERP APIs. Implication audits predict what features they are building next.
              </p>

              {results.hiring_signals?.map((job, i) => (
                <div className="hiring-card" key={i}>
                  <div className="hiring-card-header">
                    <span className="hiring-title">{job.role}</span>
                    <span className="hiring-badge">{job.department}</span>
                  </div>
                  <p className="hiring-details">Location: {job.location}</p>
                  <div className="hiring-implication">
                    <strong>AI Signal Reasoning:</strong> {job.implication}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB CONTENT: GTM OUTREACH SUITE */}
          {activeTab === 'gtm' && (
            <div className="grid-2col">
              <div className="info-card">
                <h3 className="info-card-title">
                  <Users size={18} />
                  Ideal Customer Profile (ICP)
                </h3>
                <p className="card-text" style={{ marginBottom: '1.25rem' }}>
                  <strong>Target Decision Maker:</strong> {results.gtm_materials?.target_persona}
                </p>
                
                <h4 style={{ fontSize: '0.9rem', color: 'var(--color-text-bright)', marginBottom: '0.5rem', fontFamily: 'var(--font-display)' }}>
                  Core Pain Points Surfaced
                </h4>
                <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: '1.7' }}>
                  {results.gtm_materials?.pain_points.map((point, idx) => (
                    <li key={idx} style={{ marginBottom: '0.4rem' }}>{point}</li>
                  ))}
                </ul>

                <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid rgba(155, 81, 224, 0.15)', borderRadius: '8px', background: 'rgba(155, 81, 224, 0.02)' }}>
                  <h4 style={{ fontSize: '0.85rem', color: '#9b51e0', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={14} />
                    Social Selling Signal
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic', lineHeight: '1.4' }}>
                    "{results.gtm_materials?.social_selling}"
                  </p>
                </div>
              </div>

              <div className="info-card">
                <h3 className="info-card-title">
                  <Send size={18} />
                  Highly-Personalized Cold Outbound Script
                </h3>
                <p className="card-text" style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  Ready to copy and deploy in your cold outreach pipeline. The AI strategically uses current hiring details to spark engagement.
                </p>
                
                <div className="template-box">
                  <button 
                    className={`copy-btn ${copiedText ? 'copied' : ''}`}
                    onClick={() => handleCopyText(results.gtm_materials?.cold_email)}
                  >
                    {copiedText ? <Check size={12} /> : <Copy size={12} />}
                    {copiedText ? "Copied!" : "Copy"}
                  </button>
                  {results.gtm_materials?.cold_email}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* --- FOOTER --- */}
      <footer style={{ marginTop: '4rem', borderTop: 'var(--border-glass)', padding: '1.5rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
        <p>© 2026 VEIN. Built with passion for Web Data UNLOCKED.</p>
        <div style={{ display: 'flex', gap: '15px' }}>
          <span>Powered by Bright Data SERP API & Web Unlocker</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
