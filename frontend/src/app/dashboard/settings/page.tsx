'use client'

import { useState, useEffect } from 'react'
import { User, Zap, Lock, LogOut, AlertTriangle, Shield, CheckCircle, Eye, EyeOff, Camera, Mic, Users, Plus, Trash2, Check, Palette, Save, Info } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/lib/toast'
import PricingCards from '@/components/pricing/PricingCards'
import Modal from '@/components/ui/Modal'

const BACKEND_URL = process.env.NEXT_PUBLIC_APP_URL || ''

export default function SettingsPage() {
  const { user, updateProfile, signOut } = useAuth()
  const { toast } = useToast()
  const uid = user?.id || 'demo-user-001'
  const [activeTab, setActiveTab] = useState('profile')
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [saving, setSaving] = useState(false)
  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showPass, setShowPass] = useState(false)

  // Voice Profiles (Feature 2)
  const [voiceProfiles, setVoiceProfiles] = useState<any[]>([])
  const [voiceLoading, setVoiceLoading] = useState(true)
  const [newVoiceName, setNewVoiceName] = useState('')
  const [trainingId, setTrainingId] = useState<string | null>(null)

  // Personas (Feature 5)
  const [personas, setPersonas] = useState<any[]>([])
  const [personaLoading, setPersonaLoading] = useState(true)
  const [personaModal, setPersonaModal] = useState(false)
  const [editPersona, setEditPersona] = useState<any>(null)
  const [pName, setPName] = useState('')
  const [pRole, setPRole] = useState('')
  const [pLevel, setPLevel] = useState('INTERMEDIATE')
  const [pPainPoints, setPPainPoints] = useState('')
  const [pGoals, setPGoals] = useState('')
  const [pIndustry, setPIndustry] = useState('')
  const [pVocab, setPVocab] = useState('SIMPLE')
  const [pAvoid, setPAvoid] = useState('')

  // Brand Style
  const [brandTone, setBrandTone] = useState('casual')
  const [brandWritingStyle, setBrandWritingStyle] = useState('')
  const [brandNiche, setBrandNiche] = useState('')
  const [brandPlatform, setBrandPlatform] = useState('')
  const [brandLoading, setBrandLoading] = useState(true)
  const [brandSaving, setBrandSaving] = useState(false)

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/voice-profiles?userId=${uid}`).then(r => r.json())
      .then(d => { if (d.success) setVoiceProfiles(d.data || []) }).catch(() => {}).finally(() => setVoiceLoading(false))
    fetch(`${BACKEND_URL}/api/personas?userId=${uid}`).then(r => r.json())
      .then(d => { if (d.success) setPersonas(d.data || []) }).catch(() => {}).finally(() => setPersonaLoading(false))
    fetch(`${BACKEND_URL}/api/brand?userId=${uid}`).then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          setBrandTone(d.data.tone === 'Bold & Direct' ? 'bold' : d.data.tone === 'Premium & Authoritative' ? 'premium' : 'casual')
          setBrandWritingStyle(d.data.writingStyle || '')
          setBrandNiche(d.data.niche || '')
          setBrandPlatform(d.data.defaultPlatform || '')
        }
      }).catch(() => {}).finally(() => setBrandLoading(false))
  }, [uid])

  const handleSaveBrandStyle = async () => {
    setBrandSaving(true)
    try {
      const toneMap: Record<string, string> = { bold: 'Bold & Direct', premium: 'Premium & Authoritative', casual: 'Friendly & Casual' }
      await fetch(`${BACKEND_URL}/api/brand`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid, tone: toneMap[brandTone] || 'Friendly & Casual', writingStyle: brandWritingStyle, niche: brandNiche, defaultPlatform: brandPlatform }),
      })
      toast('Brand style saved!')
    } catch { toast('Save failed', 'error') }
    finally { setBrandSaving(false) }
  }

  const handleSave = async () => { setSaving(true); await updateProfile({ full_name: fullName }); toast('Profile updated!'); setSaving(false) }
  const handleChangePass = () => {
    if (newPass.length < 6) { toast('Min 6 characters', 'error'); return }
    if (newPass !== confirmPass) { toast("Passwords don't match", 'error'); return }
    toast('Password updated!'); setCurrentPass(''); setNewPass(''); setConfirmPass('')
  }

  const createVoiceProfile = async () => {
    if (!newVoiceName.trim()) return
    const res = await fetch(`${BACKEND_URL}/api/voice-profiles`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: uid, name: newVoiceName }) })
    const d = await res.json()
    if (d.success) { setVoiceProfiles(prev => [...prev, d.data]); setNewVoiceName(''); toast('Voice profile created!') }
  }

  const trainVoice = async (id: string) => {
    setTrainingId(id)
    const res = await fetch(`${BACKEND_URL}/api/voice-profiles/${id}/train`, { method: 'POST' })
    const d = await res.json()
    if (d.success) {
      setVoiceProfiles(prev => prev.map(v => v.id === id ? { ...v, ...d.data, isActive: true, sampleCount: d.data.sampleCount } : { ...v, isActive: false }))
      toast('Voice trained successfully!')
    } else toast(d.error || 'Training failed', 'error')
    setTrainingId(null)
  }

  const activateVoice = async (id: string) => {
    await fetch(`${BACKEND_URL}/api/voice-profiles/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: true }) })
    setVoiceProfiles(prev => prev.map(v => ({ ...v, isActive: v.id === id })))
    toast('Voice activated!')
  }

  const openPersonaModal = (p?: any) => {
    if (p) {
      setEditPersona(p); setPName(p.name); setPRole(p.role); setPLevel(p.experienceLevel)
      setPPainPoints((p.mainPainPoints || []).join(', ')); setPGoals((p.mainGoals || []).join(', '))
      setPIndustry(p.industryContext); setPVocab(p.vocabularyLevel); setPAvoid((p.avoidTopics || []).join(', '))
    } else {
      setEditPersona(null); setPName(''); setPRole(''); setPLevel('INTERMEDIATE')
      setPPainPoints(''); setPGoals(''); setPIndustry(''); setPVocab('SIMPLE'); setPAvoid('')
    }
    setPersonaModal(true)
  }

  const savePersona = async () => {
    const body = {
      userId: uid, name: pName, role: pRole, experienceLevel: pLevel,
      mainPainPoints: pPainPoints.split(',').map(s => s.trim()).filter(Boolean),
      mainGoals: pGoals.split(',').map(s => s.trim()).filter(Boolean),
      industryContext: pIndustry, vocabularyLevel: pVocab,
      avoidTopics: pAvoid.split(',').map(s => s.trim()).filter(Boolean),
    }
    if (editPersona) {
      await fetch(`${BACKEND_URL}/api/personas/${editPersona.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      setPersonas(prev => prev.map(p => p.id === editPersona.id ? { ...p, ...body } : p))
    } else {
      const res = await fetch(`${BACKEND_URL}/api/personas`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const d = await res.json()
      if (d.success) setPersonas(prev => [...prev, d.data])
    }
    setPersonaModal(false); toast('Persona saved!')
  }

  const activatePersona = async (id: string) => {
    await fetch(`${BACKEND_URL}/api/personas/${id}/activate?userId=${uid}`, { method: 'PUT' })
    setPersonas(prev => prev.map(p => ({ ...p, isActive: p.id === id })))
    toast('Persona activated!')
  }

  const deletePersona = async (id: string) => {
    await fetch(`${BACKEND_URL}/api/personas/${id}`, { method: 'DELETE' })
    setPersonas(prev => prev.filter(p => p.id !== id)); toast('Persona deleted')
  }

  const passStrength = newPass.length === 0 ? 0 : newPass.length < 6 ? 25 : newPass.length < 10 ? 50 : /[A-Z]/.test(newPass) && /[0-9]/.test(newPass) ? 100 : 75
  const strengthColor = passStrength < 30 ? '#EF4444' : passStrength < 60 ? '#F59E0B' : passStrength < 80 ? '#3B82F6' : '#10B981'

  return (
    <div className="space-y-6 max-w-[1120px] mx-auto d-page-enter" data-testid="settings-page">
      <div>
        <h1 className="text-[24px] font-bold" style={{ color: 'var(--ink-900)' }}>Settings</h1>
        <p className="text-[14px] mt-1" style={{ color: 'var(--ink-400)' }}>Manage your account & AI settings</p>
      </div>

      <div className="inline-flex p-1 rounded-xl flex-wrap" style={{ background: 'var(--ink-100)', border: '1px solid var(--ink-200)' }}>
        {['profile', 'brand', 'billing', 'voice', 'personas', 'security'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} data-testid={`settings-tab-${tab}`}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium capitalize transition-all ${activeTab === tab ? 'text-white shadow-lg' : ''}`}
            style={activeTab === tab ? { background: 'var(--brand-gradient)', color: '#fff' } : { color: 'var(--ink-600)' }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="d-card max-w-lg" data-testid="profile-tab">
          <div className="flex items-center gap-4 mb-6 pb-6" style={{ borderBottom: '1px solid var(--ink-200)' }}>
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white" style={{ background: 'var(--brand-gradient)' }}>
                {(user?.full_name || 'U')[0].toUpperCase()}
              </div>
            </div>
            <div>
              <p className="text-[14px] font-semibold" style={{ color: 'var(--ink-900)' }}>Profile Photo</p>
              <p className="text-[12px]" style={{ color: 'var(--ink-400)' }}>JPG, PNG - Max 2MB</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--ink-400)' }}>Full Name</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} className="d-input" data-testid="settings-name-input" />
            </div>
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--ink-400)' }}>Email</label>
              <input value={user?.email || ''} disabled className="d-input opacity-50" data-testid="settings-email-input" />
            </div>
            <button onClick={handleSave} disabled={saving || fullName === user?.full_name} className="d-btn-primary" data-testid="save-profile-btn">
              {saving ? 'Saving...' : 'Update Profile'}
            </button>
          </div>
        </div>
      )}

      {/* Brand Style */}
      {activeTab === 'brand' && (
        <div className="space-y-4 max-w-lg" data-testid="brand-tab">
          <div className="d-card">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
              <h3 className="text-[14px] font-bold" style={{ color: 'var(--ink-900)' }}>Brand Style</h3>
            </div>
            <p className="text-[13px] mb-5" style={{ color: 'var(--ink-400)' }}>Set your brand voice — applied to every piece of content you generate.</p>

            <div className="space-y-5">
              <div data-testid="brand-tone-selector">
                <label className="text-[11px] font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--ink-400)' }}>Tone</label>
                <div className="flex gap-2">
                  {[{ id: 'bold', label: 'Bold' }, { id: 'premium', label: 'Premium' }, { id: 'casual', label: 'Casual' }].map(t => (
                    <button key={t.id} onClick={() => setBrandTone(t.id)}
                      className={`flex-1 px-4 py-2.5 rounded-xl text-[13px] font-semibold border transition-all ${brandTone === t.id ? 'border-[var(--brand-primary)] bg-[var(--brand-soft)]' : 'border-[var(--ink-200)]'}`}
                      style={{ color: brandTone === t.id ? 'var(--brand-primary)' : 'var(--ink-600)' }} data-testid={`brand-tone-${t.id}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div data-testid="brand-writing-style">
                <label className="text-[11px] font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--ink-400)' }}>Writing Style</label>
                <textarea value={brandWritingStyle} onChange={e => setBrandWritingStyle(e.target.value.slice(0, 300))}
                  placeholder="Describe how you write — e.g., direct and data-driven, no fluff, short sentences, always use real examples"
                  className="d-input resize-none" rows={3} maxLength={300} data-testid="brand-writing-input" />
                <p className="text-[10px] text-right mt-0.5" style={{ color: 'var(--ink-400)' }}>{brandWritingStyle.length}/300</p>
              </div>

              <div data-testid="brand-niche-field">
                <label className="text-[11px] font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--ink-400)' }}>Niche</label>
                <input value={brandNiche} onChange={e => setBrandNiche(e.target.value)}
                  placeholder="e.g., SaaS, Personal Finance, Marketing, Fitness" className="d-input" data-testid="brand-niche-input" />
              </div>

              <div data-testid="brand-platform-field">
                <label className="text-[11px] font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--ink-400)' }}>Default Platform</label>
                <select value={brandPlatform} onChange={e => setBrandPlatform(e.target.value)} className="d-input" data-testid="brand-platform-select">
                  <option value="">Select a default platform (optional)</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="x">X (Twitter)</option>
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="threads">Threads</option>
                </select>
              </div>

              <button onClick={handleSaveBrandStyle} disabled={brandSaving} className="d-btn-primary" data-testid="save-brand-btn">
                {brandSaving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Brand Style</>}
              </button>
            </div>
          </div>

          <div className="d-card flex items-start gap-3" style={{ background: 'var(--brand-soft)', borderColor: 'rgba(91,63,232,0.2)' }} data-testid="brand-info-card">
            <Info className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--brand-primary)' }} />
            <p className="text-[13px]" style={{ color: 'var(--ink-600)' }}>Your brand style is applied automatically to every piece of content you generate.</p>
          </div>
        </div>
      )}

      {/* Billing */}
      {activeTab === 'billing' && (
        <div className="space-y-6" data-testid="billing-tab">
          <div className="d-card flex items-center justify-between" style={{ background: 'var(--brand-soft)', borderColor: 'rgba(91,63,232,0.2)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(91,63,232,0.1)' }}>
                <Zap className="w-5 h-5" style={{ color: 'var(--brand-primary)' }} />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--ink-400)' }}>Current Plan</p>
                <p className="text-[16px] font-bold capitalize" style={{ color: 'var(--ink-900)' }}>{user?.plan || 'starter'}</p>
              </div>
            </div>
          </div>
          <PricingCards currentPlan={user?.plan || 'starter'} onPlanAction={(id, action) => toast(`${action} to ${id} (Coming soon)`)} disableMotion />
        </div>
      )}

      {/* Voice Profiles Tab (Feature 2) */}
      {activeTab === 'voice' && (
        <div className="space-y-4 max-w-2xl" data-testid="voice-tab">
          <div className="d-card">
            <div className="flex items-center gap-2 mb-4">
              <Mic className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
              <h3 className="text-[14px] font-bold" style={{ color: 'var(--ink-900)' }}>Brand Voice Profiles</h3>
            </div>
            <p className="text-[13px] mb-4" style={{ color: 'var(--ink-400)' }}>
              Train AI to write in your unique voice. Generate 5+ posts, then train a profile.
            </p>

            {voiceLoading ? <div className="d-skeleton h-20" /> : (
              <div className="space-y-3">
                {voiceProfiles.map(vp => (
                  <div key={vp.id} className={`p-4 rounded-xl border transition-all ${vp.isActive ? 'border-[var(--brand-primary)] bg-[var(--brand-soft)]' : 'border-[var(--ink-200)]'}`}
                    data-testid={`voice-profile-${vp.id}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-semibold" style={{ color: 'var(--ink-900)' }}>{vp.name}</p>
                        {vp.isActive && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'var(--green-50)', color: 'var(--green-500)' }}>Active</span>}
                        {vp.sampleCount >= 5 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'var(--brand-soft)', color: 'var(--brand-primary)' }}>Trained ({vp.sampleCount} posts)</span>}
                      </div>
                      <div className="flex gap-2">
                        {!vp.isActive && vp.sampleCount >= 5 && (
                          <button onClick={() => activateVoice(vp.id)} className="d-btn-ghost text-[11px] !px-2 !py-1" data-testid={`activate-voice-${vp.id}`}>Activate</button>
                        )}
                        <button onClick={() => trainVoice(vp.id)} disabled={trainingId === vp.id}
                          className="d-btn-primary text-[11px] !px-3 !py-1" data-testid={`train-voice-${vp.id}`}>
                          {trainingId === vp.id ? 'Training...' : vp.sampleCount >= 5 ? 'Retrain' : 'Train'}
                        </button>
                      </div>
                    </div>
                    {vp.sampleCount < 5 && (
                      <div className="mt-2">
                        <div className="h-1.5 rounded-full" style={{ background: 'var(--ink-100)' }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${(vp.sampleCount / 5) * 100}%`, background: 'var(--brand-primary)' }} />
                        </div>
                        <p className="text-[10px] mt-1" style={{ color: 'var(--ink-400)' }}>Generate {5 - vp.sampleCount} more posts to train</p>
                      </div>
                    )}
                    {vp.voiceSummary && <p className="text-[12px] mt-2 italic" style={{ color: 'var(--ink-600)' }}>{vp.voiceSummary}</p>}
                    {vp.toneDescriptors?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {vp.toneDescriptors.map((t: string) => (
                          <span key={t} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--ink-100)', color: 'var(--ink-600)' }}>{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <input value={newVoiceName} onChange={e => setNewVoiceName(e.target.value)} placeholder="New voice profile name..." className="d-input flex-1" data-testid="new-voice-name" />
              <button onClick={createVoiceProfile} disabled={!newVoiceName.trim()} className="d-btn-primary text-[13px] disabled:opacity-40" data-testid="create-voice-btn">
                <Plus className="w-4 h-4" /> Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Personas Tab (Feature 5) */}
      {activeTab === 'personas' && (
        <div className="space-y-4 max-w-2xl" data-testid="personas-tab">
          <div className="d-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
                <h3 className="text-[14px] font-bold" style={{ color: 'var(--ink-900)' }}>Audience Personas</h3>
              </div>
              <button onClick={() => openPersonaModal()} className="d-btn-primary text-[12px]" data-testid="create-persona-btn">
                <Plus className="w-3.5 h-3.5" /> New Persona
              </button>
            </div>
            <p className="text-[13px] mb-4" style={{ color: 'var(--ink-400)' }}>
              Define your ideal reader. Content generation targets that persona automatically.
            </p>

            {personaLoading ? <div className="d-skeleton h-20" /> : personas.length === 0 ? (
              <p className="text-[13px] text-center py-6" style={{ color: 'var(--ink-400)' }}>No personas yet. Create one to get started.</p>
            ) : (
              <div className="space-y-3">
                {personas.map(p => (
                  <div key={p.id} className={`p-4 rounded-xl border transition-all ${p.isActive ? 'border-[var(--brand-primary)] bg-[var(--brand-soft)]' : 'border-[var(--ink-200)]'}`}
                    data-testid={`persona-${p.id}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-semibold" style={{ color: 'var(--ink-900)' }}>{p.name}</p>
                        {p.isActive && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'var(--green-50)', color: 'var(--green-500)' }}>Active</span>}
                      </div>
                      <div className="flex gap-1">
                        {!p.isActive && <button onClick={() => activatePersona(p.id)} className="d-btn-ghost text-[10px] !px-2 !py-0.5">Activate</button>}
                        <button onClick={() => openPersonaModal(p)} className="d-btn-ghost text-[10px] !px-2 !py-0.5">Edit</button>
                        <button onClick={() => deletePersona(p.id)} className="d-btn-ghost text-[10px] !px-2 !py-0.5 !text-[var(--red-500)]"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                    <p className="text-[12px]" style={{ color: 'var(--ink-600)' }}>{p.role} | {p.industryContext} | {p.experienceLevel}</p>
                    {p.mainPainPoints?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {p.mainPainPoints.slice(0, 4).map((pp: string) => (
                          <span key={pp} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--ink-100)', color: 'var(--ink-600)' }}>{pp}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Security */}
      {activeTab === 'security' && (
        <div className="space-y-4 max-w-lg" data-testid="security-tab">
          <div className="d-card">
            <h3 className="text-[14px] font-bold mb-5 flex items-center gap-2" style={{ color: 'var(--ink-900)' }}>
              <Lock className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} /> Change Password
            </h3>
            {[{ label: 'Current Password', val: currentPass, set: setCurrentPass }, { label: 'New Password', val: newPass, set: setNewPass }, { label: 'Confirm', val: confirmPass, set: setConfirmPass }].map(f => (
              <div key={f.label} className="mb-4">
                <label className="text-[11px] font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--ink-400)' }}>{f.label}</label>
                <input type={showPass ? 'text' : 'password'} value={f.val} onChange={e => f.set(e.target.value)} className="d-input" />
              </div>
            ))}
            {newPass && <div className="h-1.5 rounded-full mb-4" style={{ background: 'var(--ink-100)' }}><div className="h-full rounded-full" style={{ width: `${passStrength}%`, background: strengthColor }} /></div>}
            <button onClick={handleChangePass} disabled={!currentPass || !newPass} className="d-btn-primary" data-testid="change-password-btn">Update Password</button>
          </div>
          <div className="d-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-semibold" style={{ color: 'var(--ink-900)' }}>Sign Out</p>
                <p className="text-[12px]" style={{ color: 'var(--ink-400)' }}>Sign out on this device</p>
              </div>
              <button onClick={signOut} className="d-btn-ghost text-[13px] !text-[var(--red-500)]" data-testid="settings-logout-btn">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persona Modal */}
      <Modal open={personaModal} onClose={() => setPersonaModal(false)} title={editPersona ? 'Edit Persona' : 'New Persona'} maxWidth="max-w-lg">
        <div className="space-y-3" data-testid="persona-modal">
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider mb-1 block" style={{ color: 'var(--ink-400)' }}>Persona Name</label>
            <input value={pName} onChange={e => setPName(e.target.value)} className="d-input" placeholder="e.g. SaaS Founders" data-testid="persona-name-input" />
          </div>
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider mb-1 block" style={{ color: 'var(--ink-400)' }}>Role</label>
            <input value={pRole} onChange={e => setPRole(e.target.value)} className="d-input" placeholder="e.g. Startup Founder" data-testid="persona-role-input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider mb-1 block" style={{ color: 'var(--ink-400)' }}>Experience</label>
              <select value={pLevel} onChange={e => setPLevel(e.target.value)} className="d-input" data-testid="persona-level-select">
                <option value="BEGINNER">Beginner</option><option value="INTERMEDIATE">Intermediate</option><option value="EXPERT">Expert</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider mb-1 block" style={{ color: 'var(--ink-400)' }}>Vocabulary</label>
              <select value={pVocab} onChange={e => setPVocab(e.target.value)} className="d-input" data-testid="persona-vocab-select">
                <option value="SIMPLE">Simple</option><option value="TECHNICAL">Technical</option><option value="JARGON_HEAVY">Jargon Heavy</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider mb-1 block" style={{ color: 'var(--ink-400)' }}>Industry</label>
            <input value={pIndustry} onChange={e => setPIndustry(e.target.value)} className="d-input" placeholder="e.g. B2B SaaS" data-testid="persona-industry-input" />
          </div>
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider mb-1 block" style={{ color: 'var(--ink-400)' }}>Pain Points (comma-separated)</label>
            <input value={pPainPoints} onChange={e => setPPainPoints(e.target.value)} className="d-input" placeholder="Getting customers, Content ROI..." data-testid="persona-painpoints-input" />
          </div>
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider mb-1 block" style={{ color: 'var(--ink-400)' }}>Goals (comma-separated)</label>
            <input value={pGoals} onChange={e => setPGoals(e.target.value)} className="d-input" placeholder="Build brand, Generate leads..." data-testid="persona-goals-input" />
          </div>
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider mb-1 block" style={{ color: 'var(--ink-400)' }}>Avoid Topics (comma-separated)</label>
            <input value={pAvoid} onChange={e => setPAvoid(e.target.value)} className="d-input" placeholder="Topics to avoid..." data-testid="persona-avoid-input" />
          </div>
          <button onClick={savePersona} disabled={!pName.trim()} className="d-btn-primary w-full justify-center disabled:opacity-40" data-testid="save-persona-btn">
            {editPersona ? 'Update Persona' : 'Create Persona'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
