import React, { useEffect, useState } from 'react';
import type { GeneratedProject } from './types';

export interface LeadItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  projectTitle: string;
  message: string;
  status: 'New' | 'Contacted' | 'Negotiating' | 'Won' | 'Lost';
  createdAt: string;
  dealValue?: string;
}

export interface FormFieldConfig {
  id: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select';
  required: boolean;
  options?: string[];
}

interface LeadCRMProps {
  apiBase: string;
  email: string;
  token: string;
  installationId: string;
  projects: GeneratedProject[];
}

export function SyntropixLeadCRM({ apiBase, email, token, installationId, projects }: LeadCRMProps) {
  const [activeTab, setActiveTab] = useState<'inbox' | 'builder'>('inbox');
  const [selectedAiLead, setSelectedAiLead] = useState<LeadItem | null>(null);
  const [aiDraftReply, setAiDraftReply] = useState<string>('');

  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const projectId = String((projects[0] as any)?.id || '');
  const requestHeaders = {
    Authorization: `Bearer ${token}`,
    'X-Device-Id': installationId,
    'content-type': 'application/json'
  };

  // Form Builder state
  const [formFields, setFormFields] = useState<FormFieldConfig[]>([
    { id: 'f-1', label: 'Full Name', type: 'text', required: true },
    { id: 'f-2', label: 'Email Address', type: 'email', required: true },
    { id: 'f-3', label: 'Phone / WhatsApp Number', type: 'tel', required: false },
    { id: 'f-4', label: 'Message & Requirements', type: 'textarea', required: true }
  ]);

  async function saveFormConfiguration() {
    if (!projectId) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`${apiBase}/projects/${projectId}/forms/config?email=${encodeURIComponent(email)}`, {
        method: 'PUT',
        headers: requestHeaders,
        body: JSON.stringify({ fields: formFields })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not save form configuration.');
      setMessage('Form configuration saved.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save form configuration.');
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!projectId || !email || !token) return;
    void fetch(`${apiBase}/projects/${projectId}/forms/config?email=${encodeURIComponent(email)}`, { headers: requestHeaders })
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (response.ok && Array.isArray(data.fields) && data.fields.length > 0) setFormFields(data.fields);
      })
      .catch(() => undefined);
  }, [apiBase, email, token, installationId, projectId]);

  async function loadLeads() {
    if (!projectId || !email || !token) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${apiBase}/projects/${projectId}/leads?email=${encodeURIComponent(email)}`, {
        headers: requestHeaders
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not load leads.');
      setLeads(Array.isArray(data.leads) ? data.leads : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load leads.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLeads();
  }, [apiBase, email, token, installationId, projectId]);

  async function updateStatus(id: string, newStatus: LeadItem['status']) {
    if (!projectId) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`${apiBase}/projects/${projectId}/leads/${id}?email=${encodeURIComponent(email)}`, {
        method: 'PATCH',
        headers: requestHeaders,
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not update lead.');
      setLeads(current => current.map(lead => lead.id === id ? { ...lead, status: newStatus } : lead));
      setMessage('Lead status saved.');
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Could not update lead.');
    } finally {
      setSaving(false);
    }
  }

  function openWhatsApp(phone: string, text: string) {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  }

  function handleTriggerAiAssistant(lead: LeadItem) {
    setSelectedAiLead(lead);
    const suggested = `Hi ${lead.name}, thank you for reaching out regarding "${lead.projectTitle}"! 

I saw your request: "${lead.message}". I'd be delighted to assist you with full pricing and arrange your consultation.

Would you be available for a brief 5-minute call today or preferred timing?`;
    setAiDraftReply(suggested);
  }

  function exportCSV() {
    const headers = ['ID,Name,Email,Phone,Project,Message,Status,Date,DealValue'];
    const rows = leads.map(l => 
      `"${l.id}","${l.name}","${l.email}","${l.phone}","${l.projectTitle}","${l.message.replace(/"/g, '""')}","${l.status}","${l.createdAt}","${l.dealValue || ''}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `quantora_leads_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase()) || 
                          l.email.toLowerCase().includes(search.toLowerCase()) ||
                          l.projectTitle.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || l.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="feature-studio-container lead-crm-studio" style={{ color: '#f8fafc', padding: '20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        background: '#1e293b',
        padding: '20px',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.08)',
        marginBottom: '20px'
      }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#6366f1', letterSpacing: '0.1em' }}>
            CONVERSION ENGINE · FORMS &amp; LEAD CRM
          </span>
          <h2 style={{ fontSize: '22px', margin: '4px 0 0', fontWeight: 800 }}>
            Unified Leads &amp; Interactive Form Studio
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 0' }}>
            Collect, organize, and reply to inbound customer inquiries with 1-tap AI assistance and WhatsApp followup.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('inbox')}
            style={{
              background: activeTab === 'inbox' ? '#6366f1' : '#0f172a',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '13px'
            }}
          >
            📥 Lead Inbox ({leads.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('builder')}
            style={{
              background: activeTab === 'builder' ? '#6366f1' : '#0f172a',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '13px'
            }}
          >
            🛠️ Form Builder
          </button>
          <button
            type="button"
            onClick={exportCSV}
            style={{
              background: '#0f172a',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff',
              padding: '8px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* LEAD INBOX TAB */}
      {activeTab === 'inbox' && (
        <>
          {error && <div style={{ background: 'rgba(239,68,68,.14)', border: '1px solid rgba(239,68,68,.45)', padding: 10, borderRadius: 8, marginBottom: 12 }}>{error}</div>}
          {message && <div style={{ background: 'rgba(16,185,129,.14)', border: '1px solid rgba(16,185,129,.45)', padding: 10, borderRadius: 8, marginBottom: 12 }}>{message}</div>}
          {/* Controls Bar */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Search leads by name, email, or website..."
              style={{
                flex: 1,
                minWidth: '240px',
                background: '#1e293b',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: '#fff',
                fontSize: '13px'
              }}
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                background: '#1e293b',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: '#fff',
                fontSize: '13px'
              }}
            >
              <option value="all">All Statuses ({leads.length})</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="negotiating">Negotiating</option>
              <option value="won">Won / Paid</option>
              <option value="lost">Lost</option>
            </select>
          </div>

          {/* Lead Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loading ? <div style={{ background: '#1e293b', padding: 20, borderRadius: 10, color: '#94a3b8' }}>Loading leads from the project backend…</div> : filteredLeads.length === 0 ? <div style={{ background: '#1e293b', padding: 20, borderRadius: 10, color: '#94a3b8' }}>{projectId ? 'No submitted leads match this filter.' : 'Select or generate a project to view its leads.'}</div> : filteredLeads.map((lead) => (
              <div
                key={lead.id}
                style={{
                  background: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '14px'
                }}
              >
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>{lead.name}</h3>
                    <span style={{
                      background: lead.status === 'New' ? 'rgba(99,102,241,0.2)' : lead.status === 'Won' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                      color: lead.status === 'New' ? '#818cf8' : lead.status === 'Won' ? '#34d399' : '#fbbf24',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700
                    }}>
                      {lead.status}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{lead.createdAt}</span>
                  </div>

                  <p style={{ margin: '4px 0 8px', fontSize: '13px', color: '#cbd5e1' }}>
                    "{lead.message}"
                  </p>

                  <div style={{ display: 'flex', gap: '14px', fontSize: '12px', color: '#94a3b8', flexWrap: 'wrap' }}>
                    <span>📧 {lead.email}</span>
                    <span>📞 {lead.phone}</span>
                    <span>🌐 {lead.projectTitle}</span>
                    {lead.dealValue && <strong style={{ color: '#34d399' }}>Value: {lead.dealValue}</strong>}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleTriggerAiAssistant(lead)}
                      style={{
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        border: 'none',
                        color: '#fff',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 700
                      }}
                    >
                      ✨ AI Reply
                    </button>
                    <button
                      type="button"
                      onClick={() => openWhatsApp(lead.phone, `Hi ${lead.name}, following up on your inquiry!`)}
                      style={{
                        background: '#10b981',
                        border: 'none',
                        color: '#fff',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 700
                      }}
                    >
                      💬 WhatsApp
                    </button>
                  </div>

                  <select
                    value={lead.status}
                    onChange={(e) => updateStatus(lead.id, e.target.value as any)}
                    style={{
                      background: '#0f172a',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  >
                    <option value="New">Set: New</option>
                    <option value="Contacted">Set: Contacted</option>
                    <option value="Negotiating">Set: Negotiating</option>
                    <option value="Won">Set: Won / Paid</option>
                    <option value="Lost">Set: Lost</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* FORM BUILDER TAB */}
      {activeTab === 'builder' && (
        <div style={{ background: '#1e293b', padding: '24px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700 }}>Custom Website Form Builder</h3>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 20px' }}>
            Configure fields for your website's contact, booking, or quote request forms.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {formFields.map((field, idx) => (
              <div
                key={field.id}
                style={{
                  background: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <strong style={{ fontSize: '14px' }}>{idx + 1}. {field.label}</strong>
                  <span style={{ marginLeft: '10px', color: '#6366f1', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                    [{field.type}]
                  </span>
                  {field.required && (
                    <span style={{ marginLeft: '6px', color: '#f43f5e', fontSize: '11px', fontWeight: 700 }}>
                      *Required
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setFormFields(formFields.filter(f => f.id !== field.id))}
                  style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '14px' }}
                >
                  ✕ Remove
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                const label = prompt('Enter field label:');
                if (label) {
                  setFormFields([...formFields, { id: `f-${Date.now()}`, label, type: 'text', required: false }]);
                }
              }}
              style={{ background: '#6366f1', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}
            >
              + Add Custom Field
            </button>
            <button
              type="button"
              onClick={() => void saveFormConfiguration()}
              disabled={saving || !projectId}
              style={{ background: '#10b981', border: 'none', color: '#06281d', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}
            >
              {saving ? 'Saving…' : 'Save Form Configuration'}
            </button>
          </div>
        </div>
      )}

      {/* AI REPLY ASSISTANT MODAL */}
      {selectedAiLead && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(10, 15, 29, 0.85)',
          backdropFilter: 'blur(10px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            borderRadius: '20px',
            maxWidth: '600px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#6366f1', fontWeight: 800 }}>AI LEAD ASSISTANT</span>
                <h3 style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 700 }}>
                  Crafted Reply for {selectedAiLead.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAiLead(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <textarea
              rows={6}
              value={aiDraftReply}
              onChange={(e) => setAiDraftReply(e.target.value)}
              style={{
                width: '100%',
                background: '#1e293b',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '10px',
                padding: '12px',
                color: '#fff',
                fontSize: '13px',
                lineHeight: 1.5,
                marginBottom: '16px'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setSelectedAiLead(null)}
                style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: '#94a3b8', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  openWhatsApp(selectedAiLead.phone, aiDraftReply);
                  updateStatus(selectedAiLead.id, 'Contacted');
                  setSelectedAiLead(null);
                }}
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#fff', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}
              >
                🚀 Send via WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
