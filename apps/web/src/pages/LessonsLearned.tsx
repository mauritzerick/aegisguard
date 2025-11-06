import { useState } from 'react';
import { Nav } from '../components/Nav';

export function LessonsLearned() {
  const [activeSection, setActiveSection] = useState('intro');

  const sections = [
    { id: 'intro', title: 'Introduction', icon: '📖' },
    { id: 'error1', title: 'Script Catastrophe', icon: '🚨', severity: 'critical' },
    { id: 'error2', title: 'Import Inconsistency', icon: '⚠️', severity: 'high' },
    { id: 'error3', title: 'WebSocket Config', icon: '⚠️', severity: 'high' },
    { id: 'error4', title: 'RBAC Permissions', icon: '⚠️', severity: 'high' },
    { id: 'error5', title: 'Dark Mode Forms', icon: '⚠️', severity: 'medium' },
    { id: 'summary', title: 'Summary', icon: '📊' },
    { id: 'takeaways', title: 'Key Takeaways', icon: '🎯' }
  ];

  const getSeverityColor = (severity?: string) => {
    if (severity === 'critical') return '#C62828';
    if (severity === 'high') return '#F57C00';
    if (severity === 'medium') return '#FFA726';
    return 'var(--text-secondary)';
  };

  return (
    <>
      <Nav />
      <div style={{
        display: 'flex',
        backgroundColor: 'var(--bg-primary)',
        minHeight: '100vh'
      }}>
        {/* Sidebar Navigation */}
        <div style={{
          width: '280px',
          padding: '24px',
          borderRight: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto'
        }}>
          <div style={{
            padding: '16px',
            backgroundColor: 'rgba(198, 40, 40, 0.1)',
            border: '1px solid var(--error)',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <div style={{ fontSize: '32px', textAlign: 'center', marginBottom: '8px' }}>🎓</div>
            <h2 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              textAlign: 'center',
              margin: 0
            }}>
              Lessons Learned
            </h2>
            <p style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              textAlign: 'center',
              margin: '4px 0 0 0'
            }}>
              October 31, 2025
            </p>
          </div>

          <nav>
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 16px',
                  marginBottom: '4px',
                  fontSize: '14px',
                  backgroundColor: activeSection === section.id
                    ? 'rgba(21, 101, 192, 0.1)'
                    : 'transparent',
                  color: 'var(--text-primary)',
                  border: activeSection === section.id
                    ? '1px solid var(--accent-primary)'
                    : '1px solid transparent',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: activeSection === section.id ? 500 : 400,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (activeSection !== section.id) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeSection !== section.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span style={{ fontSize: '20px' }}>{section.icon}</span>
                <span style={{ flex: 1 }}>{section.title}</span>
                {section.severity && (
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: getSeverityColor(section.severity)
                  }} />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div style={{
          flex: 1,
          padding: '40px 48px',
          maxWidth: '900px',
          margin: '0 auto'
        }}>
          {activeSection === 'intro' && (
            <div>
              <h1 style={{
                fontSize: '36px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '16px'
              }}>
                Lessons Learned Journal
              </h1>
              <div style={{
                display: 'flex',
                gap: '16px',
                marginBottom: '32px',
                flexWrap: 'wrap'
              }}>
                <div style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: 'var(--text-secondary)'
                }}>
                  📅 Date: October 31, 2025
                </div>
                <div style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: 'var(--text-secondary)'
                }}>
                  ⏱️ Session: ~2 hours
                </div>
                <div style={{
                  padding: '8px 16px',
                  backgroundColor: 'rgba(76, 175, 80, 0.1)',
                  border: '1px solid var(--success)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: 'var(--success)',
                  fontWeight: 500
                }}>
                  ✅ All Systems Operational
                </div>
              </div>

              <div style={{
                padding: '24px',
                backgroundColor: 'rgba(21, 101, 192, 0.1)',
                border: '1px solid var(--accent-primary)',
                borderRadius: '8px',
                marginBottom: '32px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: 'var(--accent-primary)',
                  marginBottom: '12px'
                }}>
                  Purpose of This Journal
                </h3>
                <p style={{
                  fontSize: '15px',
                  color: 'var(--text-primary)',
                  lineHeight: '1.7',
                  margin: 0
                }}>
                  This journal documents the critical mistakes made during the AegisGuard development session, 
                  their root causes, impact, recovery process, and most importantly - the lessons learned. 
                  The goal is to ensure these mistakes are never repeated and to provide a learning resource 
                  for both developers and AI assistants.
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '32px'
              }}>
                <div style={{
                  padding: '20px',
                  backgroundColor: 'rgba(198, 40, 40, 0.1)',
                  border: '1px solid var(--error)',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🚨</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--error)', marginBottom: '4px' }}>1</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Critical Error</div>
                </div>
                <div style={{
                  padding: '20px',
                  backgroundColor: 'rgba(245, 124, 0, 0.1)',
                  border: '1px solid var(--warning)',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚠️</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--warning)', marginBottom: '4px' }}>3</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>High Priority</div>
                </div>
                <div style={{
                  padding: '20px',
                  backgroundColor: 'rgba(255, 167, 38, 0.1)',
                  border: '1px solid #FFA726',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📝</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#FFA726', marginBottom: '4px' }}>1</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Medium Priority</div>
                </div>
              </div>

              <blockquote style={{
                borderLeft: '4px solid var(--accent-primary)',
                paddingLeft: '20px',
                margin: '32px 0',
                fontStyle: 'italic',
                color: 'var(--text-secondary)',
                fontSize: '16px'
              }}>
                "The only real mistake is the one from which we learn nothing." — Henry Ford
              </blockquote>
            </div>
          )}

          {activeSection === 'error1' && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '24px'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(198, 40, 40, 0.1)',
                  fontSize: '32px'
                }}>
                  🚨
                </div>
                <div>
                  <h1 style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    margin: 0,
                    marginBottom: '4px'
                  }}>
                    Critical Error #1: The Automated Script Catastrophe
                  </h1>
                  <span style={{
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '12px',
                    backgroundColor: 'rgba(198, 40, 40, 0.2)',
                    color: 'var(--error)'
                  }}>
                    CRITICAL SEVERITY
                  </span>
                </div>
              </div>

              <div style={{
                padding: '20px',
                backgroundColor: 'rgba(198, 40, 40, 0.1)',
                border: '1px solid var(--error)',
                borderRadius: '8px',
                marginBottom: '32px'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--error)',
                  marginBottom: '12px'
                }}>
                  ⚡ What Happened
                </h3>
                <p style={{
                  fontSize: '15px',
                  color: 'var(--text-primary)',
                  lineHeight: '1.7',
                  margin: 0
                }}>
                  Created an automated Node.js script to fix dark mode colors across multiple React files. 
                  The script contained a critical bug that <strong>corrupted 10 files</strong> by overwriting 
                  them with just the text "utf8".
                </p>
              </div>

              <h2 style={{
                fontSize: '22px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginTop: '32px',
                marginBottom: '16px'
              }}>
                The Bug
              </h2>
              <div style={{
                padding: '20px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                marginBottom: '24px'
              }}>
                <pre style={{
                  margin: 0,
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  overflow: 'auto',
                  lineHeight: '1.6'
                }}>
{`// ❌ WRONG - Catastrophic Error
function updateFile(filePath, content) {
  fs.writeFileSync(filePath, 'utf8');  
  // Only writes "utf8" as content!
}

// ✅ CORRECT
function updateFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');  
  // content first, encoding second
}`}
                </pre>
              </div>

              <h2 style={{
                fontSize: '22px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginTop: '32px',
                marginBottom: '16px'
              }}>
                Impact
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
              }}>
                <div style={{
                  padding: '16px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--error)', marginBottom: '4px' }}>10</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Files Corrupted</div>
                </div>
                <div style={{
                  padding: '16px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--error)', marginBottom: '4px' }}>180 KB</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Code Lost</div>
                </div>
                <div style={{
                  padding: '16px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--warning)', marginBottom: '4px' }}>30 min</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Recovery Time</div>
                </div>
              </div>

              <h2 style={{
                fontSize: '22px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginTop: '32px',
                marginBottom: '16px'
              }}>
                Root Causes
              </h2>
              <ul style={{
                paddingLeft: '24px',
                color: 'var(--text-primary)',
                lineHeight: '1.8',
                marginBottom: '24px'
              }}>
                <li><strong>No Test Run:</strong> Didn't test the script on a single file first</li>
                <li><strong>No Backup:</strong> Didn't create backups before running bulk operations</li>
                <li><strong>No Git:</strong> Repository wasn't committed, so no version control safety net</li>
                <li><strong>No Validation:</strong> Didn't verify file contents after writing</li>
                <li><strong>Blind Trust:</strong> Assumed the script was correct without review</li>
              </ul>

              <h2 style={{
                fontSize: '22px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginTop: '32px',
                marginBottom: '16px'
              }}>
                Prevention Checklist
              </h2>
              <div style={{
                padding: '20px',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                border: '1px solid var(--success)',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '2' }}>
                  {[
                    'Is this in a git repository?',
                    'Have I committed recent changes?',
                    'Have I tested on ONE file first?',
                    'Do I have backups?',
                    'Have I reviewed the script logic?',
                    'Do I understand the API being used?',
                    'Is there a dry-run or preview mode?',
                    'Can I recover if something goes wrong?'
                  ].map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input type="checkbox" style={{ width: '16px', height: '16px' }} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'error2' && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '24px'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(245, 124, 0, 0.1)',
                  fontSize: '32px'
                }}>
                  ⚠️
                </div>
                <div>
                  <h1 style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    margin: 0,
                    marginBottom: '4px'
                  }}>
                    Error #2: Import Name Inconsistency
                  </h1>
                  <span style={{
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '12px',
                    backgroundColor: 'rgba(245, 124, 0, 0.2)',
                    color: 'var(--warning)'
                  }}>
                    HIGH SEVERITY
                  </span>
                </div>
              </div>

              <div style={{
                padding: '20px',
                backgroundColor: 'rgba(245, 124, 0, 0.1)',
                border: '1px solid var(--warning)',
                borderRadius: '8px',
                marginBottom: '32px'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--warning)',
                  marginBottom: '12px'
                }}>
                  ⚡ What Happened
                </h3>
                <p style={{
                  fontSize: '15px',
                  color: 'var(--text-primary)',
                  lineHeight: '1.7',
                  margin: 0
                }}>
                  Backend failed to start with dependency injection errors because of inconsistent naming.
                  The service was exported as <code style={{ fontFamily: 'monospace', backgroundColor: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '3px' }}>ClickHouseService</code> (capital H) 
                  but imported as <code style={{ fontFamily: 'monospace', backgroundColor: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '3px' }}>ClickhouseService</code> (lowercase h).
                </p>
              </div>

              <h2 style={{
                fontSize: '22px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginTop: '32px',
                marginBottom: '16px'
              }}>
                The Code
              </h2>
              <div style={{
                padding: '20px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                marginBottom: '24px'
              }}>
                <pre style={{
                  margin: 0,
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  overflow: 'auto',
                  lineHeight: '1.6'
                }}>
{`// ❌ WRONG - Case mismatch
import { ClickhouseService } from './clickhouse.service';

export class InsightsService {
  constructor(private readonly clickhouse: ClickhouseService) {}
}

// ✅ CORRECT - Match the actual export
import { ClickHouseService } from './clickhouse.service';

export class InsightsService {
  constructor(private readonly clickhouse: ClickHouseService) {}
}`}
                </pre>
              </div>

              <h2 style={{
                fontSize: '22px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginTop: '32px',
                marginBottom: '16px'
              }}>
                Lessons Learned
              </h2>
              <ul style={{
                paddingLeft: '24px',
                color: 'var(--text-primary)',
                lineHeight: '1.8',
                marginBottom: '24px'
              }}>
                <li>Check existing file naming patterns before creating new imports</li>
                <li>Use grep/search to find actual class exports before importing</li>
                <li>Verify class names match exactly when creating new services</li>
                <li>Use IDE auto-imports instead of manual typing</li>
                <li>Enable strict TypeScript linting</li>
              </ul>

              <div style={{
                padding: '20px',
                backgroundColor: 'rgba(21, 101, 192, 0.1)',
                border: '1px solid var(--accent-primary)',
                borderRadius: '8px'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--accent-primary)',
                  marginBottom: '12px'
                }}>
                  💡 Pro Tip
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  margin: 0,
                  lineHeight: '1.6'
                }}>
                  Before creating new imports, search for existing patterns:
                </p>
                <pre style={{
                  margin: '12px 0 0 0',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--bg-secondary)',
                  padding: '12px',
                  borderRadius: '4px',
                  overflow: 'auto'
                }}>
{`grep "export class.*Service" apps/api/src/**/*.ts`}
                </pre>
              </div>
            </div>
          )}

          {activeSection === 'error3' && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '24px'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(245, 124, 0, 0.1)',
                  fontSize: '32px'
                }}>
                  ⚠️
                </div>
                <div>
                  <h1 style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    margin: 0,
                    marginBottom: '4px'
                  }}>
                    Error #3: Missing WebSocket Adapter
                  </h1>
                  <span style={{
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '12px',
                    backgroundColor: 'rgba(245, 124, 0, 0.2)',
                    color: 'var(--warning)'
                  }}>
                    HIGH SEVERITY
                  </span>
                </div>
              </div>

              <div style={{
                padding: '20px',
                backgroundColor: 'rgba(245, 124, 0, 0.1)',
                border: '1px solid var(--warning)',
                borderRadius: '8px',
                marginBottom: '32px'
              }}>
                <p style={{
                  fontSize: '15px',
                  color: 'var(--text-primary)',
                  lineHeight: '1.7',
                  margin: 0
                }}>
                  Created WebSocket gateway but forgot to configure the WebSocket adapter in NestJS, 
                  causing server startup errors: <em>"No driver (WebSockets) has been selected"</em>
                </p>
              </div>

              <h2 style={{
                fontSize: '22px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginTop: '32px',
                marginBottom: '16px'
              }}>
                The Fix
              </h2>
              <div style={{
                padding: '20px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                marginBottom: '24px'
              }}>
                <pre style={{
                  margin: 0,
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  overflow: 'auto',
                  lineHeight: '1.6'
                }}>
{`// main.ts
import { WsAdapter } from '@nestjs/platform-ws';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new WsAdapter(app));  // ✅ Added
  // ... rest of setup
}`}
                </pre>
              </div>

              <div style={{
                padding: '20px',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                border: '1px solid var(--success)',
                borderRadius: '8px'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--success)',
                  marginBottom: '12px'
                }}>
                  ✅ Key Lesson
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  margin: 0,
                  lineHeight: '1.6'
                }}>
                  Follow complete feature patterns - don't create partial implementations. 
                  When adding framework features, always check the documentation for required configuration.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'error4' && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '24px'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(245, 124, 0, 0.1)',
                  fontSize: '32px'
                }}>
                  ⚠️
                </div>
                <div>
                  <h1 style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    margin: 0,
                    marginBottom: '4px'
                  }}>
                    Error #4: Missing RBAC Permissions
                  </h1>
                  <span style={{
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '12px',
                    backgroundColor: 'rgba(245, 124, 0, 0.2)',
                    color: 'var(--warning)'
                  }}>
                    HIGH SEVERITY
                  </span>
                </div>
              </div>

              <div style={{
                padding: '20px',
                backgroundColor: 'rgba(245, 124, 0, 0.1)',
                border: '1px solid var(--warning)',
                borderRadius: '8px',
                marginBottom: '32px'
              }}>
                <p style={{
                  fontSize: '15px',
                  color: 'var(--text-primary)',
                  lineHeight: '1.7',
                  margin: 0
                }}>
                  Admin users got 403 Forbidden errors when trying to access logs, metrics, and traces 
                  because the ADMIN role didn't include observability permissions like <code style={{ fontFamily: 'monospace', backgroundColor: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '3px' }}>logs:read</code> 
                  , <code style={{ fontFamily: 'monospace', backgroundColor: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '3px' }}>metrics:read</code>, etc.
                </p>
              </div>

              <h2 style={{
                fontSize: '22px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginTop: '32px',
                marginBottom: '16px'
              }}>
                The Fix
              </h2>
              <p style={{
                fontSize: '15px',
                color: 'var(--text-secondary)',
                marginBottom: '16px'
              }}>
                Updated the seed script to include all observability permissions for the ADMIN role:
              </p>
              <div style={{
                padding: '20px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                marginBottom: '24px'
              }}>
                <pre style={{
                  margin: 0,
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  overflow: 'auto',
                  lineHeight: '1.6'
                }}>
{`permissions: [
  'users:read', 'users:update', 
  'roles:manage', 'apikeys:manage', 
  'events:read', 'audit:read',
  // ✅ Added observability permissions
  'logs:read', 'logs:write',
  'metrics:read', 'metrics:write',
  'traces:read', 'traces:write',
  'rum:read', 'rum:write',
  'monitors:read', 'monitors:write',
  'slo:read', 'slo:write',
  'usage:read'
]`}
                </pre>
              </div>

              <div style={{
                padding: '20px',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                border: '1px solid var(--success)',
                borderRadius: '8px'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--success)',
                  marginBottom: '12px'
                }}>
                  ✅ Key Lesson
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  margin: 0,
                  lineHeight: '1.6'
                }}>
                  Check RBAC permissions when adding new protected endpoints. 
                  Update seed scripts whenever adding new feature domains. 
                  Test with fresh database to catch missing seed data.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'error5' && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '24px'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 167, 38, 0.1)',
                  fontSize: '32px'
                }}>
                  ⚠️
                </div>
                <div>
                  <h1 style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    margin: 0,
                    marginBottom: '4px'
                  }}>
                    Error #5: Incomplete Dark Mode
                  </h1>
                  <span style={{
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 167, 38, 0.2)',
                    color: '#FFA726'
                  }}>
                    MEDIUM SEVERITY
                  </span>
                </div>
              </div>

              <div style={{
                padding: '20px',
                backgroundColor: 'rgba(255, 167, 38, 0.1)',
                border: '1px solid #FFA726',
                borderRadius: '8px',
                marginBottom: '32px'
              }}>
                <p style={{
                  fontSize: '15px',
                  color: 'var(--text-primary)',
                  lineHeight: '1.7',
                  margin: 0
                }}>
                  Fixed dark mode for page components, but forgot to update global form element styles 
                  (dropdowns, selects, inputs), making dropdown text unreadable in dark mode.
                </p>
              </div>

              <h2 style={{
                fontSize: '22px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginTop: '32px',
                marginBottom: '16px'
              }}>
                The Fix
              </h2>
              <div style={{
                padding: '20px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                marginBottom: '24px'
              }}>
                <pre style={{
                  margin: 0,
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  overflow: 'auto',
                  lineHeight: '1.6'
                }}>
{`/* global.css - Added explicit form styling */
select {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}

select option {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}`}
                </pre>
              </div>

              <h2 style={{
                fontSize: '22px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginTop: '32px',
                marginBottom: '16px'
              }}>
                Theming Checklist
              </h2>
              <div style={{
                padding: '20px',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                border: '1px solid var(--success)',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '2' }}>
                  {[
                    'Pages & Components',
                    'Form Elements (inputs, selects, textareas)',
                    'Buttons',
                    'Modals & Overlays',
                    'Dropdowns',
                    'Tooltips',
                    'Hover & Focus States',
                    'Disabled States'
                  ].map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ color: 'var(--success)' }}>✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'summary' && (
            <div>
              <h1 style={{
                fontSize: '36px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '32px'
              }}>
                Summary: Mistakes by Category
              </h1>

              <div style={{
                display: 'grid',
                gap: '24px',
                marginBottom: '32px'
              }}>
                <div style={{
                  padding: '24px',
                  backgroundColor: 'rgba(198, 40, 40, 0.1)',
                  border: '2px solid var(--error)',
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '32px' }}>🚨</span>
                    <div>
                      <h3 style={{
                        fontSize: '20px',
                        fontWeight: 600,
                        color: 'var(--error)',
                        margin: 0
                      }}>
                        Automation Errors
                      </h3>
                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                        Critical Severity
                      </p>
                    </div>
                  </div>
                  <ul style={{ paddingLeft: '24px', color: 'var(--text-primary)', lineHeight: '1.8', margin: 0 }}>
                    <li>File Corruption Script: 10 files, 180KB lost</li>
                    <li><strong>Prevention:</strong> Test on one file first, use git, create backups</li>
                  </ul>
                </div>

                <div style={{
                  padding: '24px',
                  backgroundColor: 'rgba(245, 124, 0, 0.1)',
                  border: '2px solid var(--warning)',
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '32px' }}>⚙️</span>
                    <div>
                      <h3 style={{
                        fontSize: '20px',
                        fontWeight: 600,
                        color: 'var(--warning)',
                        margin: 0
                      }}>
                        Configuration Errors
                      </h3>
                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                        High Severity
                      </p>
                    </div>
                  </div>
                  <ul style={{ paddingLeft: '24px', color: 'var(--text-primary)', lineHeight: '1.8', margin: 0 }}>
                    <li>WebSocket Adapter: Server startup failure</li>
                    <li>RBAC Permissions: 403 errors blocking features</li>
                    <li><strong>Prevention:</strong> Follow framework docs, update seed data</li>
                  </ul>
                </div>

                <div style={{
                  padding: '24px',
                  backgroundColor: 'rgba(255, 167, 38, 0.1)',
                  border: '2px solid #FFA726',
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '32px' }}>📝</span>
                    <div>
                      <h3 style={{
                        fontSize: '20px',
                        fontWeight: 600,
                        color: '#FFA726',
                        margin: 0
                      }}>
                        Consistency Errors
                      </h3>
                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                        Medium Severity
                      </p>
                    </div>
                  </div>
                  <ul style={{ paddingLeft: '24px', color: 'var(--text-primary)', lineHeight: '1.8', margin: 0 }}>
                    <li>Import Name Casing: Dependency injection failures</li>
                    <li>Incomplete Theming: Form elements unreadable</li>
                    <li><strong>Prevention:</strong> Use IDE auto-complete, comprehensive testing</li>
                  </ul>
                </div>
              </div>

              <div style={{
                padding: '24px',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                border: '1px solid var(--success)',
                borderRadius: '8px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: 'var(--success)',
                  marginBottom: '16px'
                }}>
                  💚 Positive Outcomes
                </h3>
                <ul style={{ paddingLeft: '24px', color: 'var(--text-primary)', lineHeight: '1.8', margin: 0 }}>
                  <li>Better file organization: Recreated files with improved structure</li>
                  <li>Enhanced dark mode: More comprehensive than original</li>
                  <li>Complete permission system: Now includes all observability features</li>
                  <li>Robust recovery process: Demonstrated quick problem-solving</li>
                  <li>Learning documentation: Created this journal for future reference</li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === 'takeaways' && (
            <div>
              <h1 style={{
                fontSize: '36px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '32px'
              }}>
                🎯 Key Takeaways: The Golden Rules
              </h1>

              <div style={{
                padding: '24px',
                backgroundColor: 'rgba(21, 101, 192, 0.1)',
                border: '1px solid var(--accent-primary)',
                borderRadius: '8px',
                marginBottom: '32px'
              }}>
                <h2 style={{
                  fontSize: '22px',
                  fontWeight: 600,
                  color: 'var(--accent-primary)',
                  marginBottom: '20px'
                }}>
                  For AI Assistants
                </h2>
                <div style={{ display: 'grid', gap: '20px' }}>
                  {[
                    {
                      title: 'Test Before Executing',
                      items: ['One file first, not bulk operations', 'Verify results before proceeding', 'Use dry-run modes when available']
                    },
                    {
                      title: 'Safety First',
                      items: ['Always suggest git commits before changes', 'Encourage backups before destructive ops', 'Provide rollback plans']
                    },
                    {
                      title: 'Follow Patterns',
                      items: ['Check existing code before creating new code', 'Match naming conventions', "Complete feature implementations (don't leave half-done)"]
                    },
                    {
                      title: 'Verify Everything',
                      items: ['API signatures', 'Class names and imports', 'Configuration requirements', 'Permission grants']
                    },
                    {
                      title: 'Think Holistically',
                      items: ['Global styles affect all elements', 'New features need seed data updates', 'Framework features need configuration']
                    }
                  ].map((section, idx) => (
                    <div key={idx}>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: '12px'
                      }}>
                        {idx + 1}. {section.title}
                      </h3>
                      <ul style={{ paddingLeft: '24px', color: 'var(--text-secondary)', lineHeight: '1.8', margin: 0 }}>
                        {section.items.map((item, itemIdx) => (
                          <li key={itemIdx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{
                padding: '24px',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                border: '1px solid var(--success)',
                borderRadius: '8px',
                marginBottom: '32px'
              }}>
                <h2 style={{
                  fontSize: '22px',
                  fontWeight: 600,
                  color: 'var(--success)',
                  marginBottom: '20px'
                }}>
                  For Developers
                </h2>
                <div style={{ display: 'grid', gap: '20px' }}>
                  {[
                    {
                      title: 'Version Control is Non-Negotiable',
                      items: ['Commit frequently', 'Always have a rollback option', 'Use git for EVERY project']
                    },
                    {
                      title: 'Test Incrementally',
                      items: ["Don't add 10 features then test", 'Test each change as you go', 'Use fresh environments to catch seed issues']
                    },
                    {
                      title: 'Documentation Matters',
                      items: ['Read framework docs before using features', 'Document your own permission requirements', 'Maintain a changelog']
                    },
                    {
                      title: 'Automation is Powerful but Dangerous',
                      items: ['Review all automated scripts', 'Test on sample data first', 'Have a rollback plan']
                    }
                  ].map((section, idx) => (
                    <div key={idx}>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: '12px'
                      }}>
                        {idx + 1}. {section.title}
                      </h3>
                      <ul style={{ paddingLeft: '24px', color: 'var(--text-secondary)', lineHeight: '1.8', margin: 0 }}>
                        {section.items.map((item, itemIdx) => (
                          <li key={itemIdx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <blockquote style={{
                borderLeft: '4px solid var(--accent-primary)',
                paddingLeft: '20px',
                margin: '32px 0',
                fontStyle: 'italic',
                color: 'var(--text-secondary)',
                fontSize: '18px',
                lineHeight: '1.6'
              }}>
                "Success is not final, failure is not fatal: it is the courage to continue that counts." 
                <br />— Winston Churchill
              </blockquote>

              <blockquote style={{
                borderLeft: '4px solid var(--success)',
                paddingLeft: '20px',
                margin: '32px 0',
                fontStyle: 'italic',
                color: 'var(--text-secondary)',
                fontSize: '18px',
                lineHeight: '1.6'
              }}>
                "I have not failed. I've just found 10,000 ways that won't work." 
                <br />— Thomas Edison
              </blockquote>

              <div style={{
                padding: '24px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '12px'
                }}>
                  Final Wisdom
                </h3>
                <p style={{
                  fontSize: '16px',
                  color: 'var(--text-primary)',
                  lineHeight: '1.7',
                  margin: 0
                }}>
                  This journal exists so we find the right way faster next time. 🚀
                  <br />
                  <br />
                  <em style={{ color: 'var(--text-secondary)' }}>
                    Document Version: 1.0 • Living Document • Updated Oct 31, 2025
                  </em>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}



