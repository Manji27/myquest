import { useEffect, useMemo, useRef, useState } from 'react'
import type { AppState } from '../types'
import { computeStats } from '../lib/stats'
import { ACHIEVEMENTS, isUnlocked } from '../lib/achievements'
import { LifepathCard } from './LifepathCard'
import { downloadBackup, parseBackup } from '../lib/backup'
import type { CloudSync } from '../lib/useCloudSync'
import {
  disablePush,
  enablePush,
  isPushEnabled,
  localTimezone,
  pushSupported,
  schedulePush,
  testPush,
} from '../lib/push'
import { Heatmap } from './Heatmap'
import { WeeklySummary } from './WeeklySummary'
import { CYBERPUNK_ACHIEVEMENT_ART } from './cyberpunk/achievementArt'
import cyberpunkCloudIcon from '../../references/cyberpunk-ui/cyberpunk-icons/ui-cloud-sync.png'
import cyberpunkNotificationIcon from '../../references/cyberpunk-ui/cyberpunk-icons/ui-notification-bell.png'
import cyberpunkBackupExportIcon from '../../references/cyberpunk-ui/cyberpunk-icons/ui-backup-export.png'
import cyberpunkBackupImportIcon from '../../references/cyberpunk-ui/cyberpunk-icons/ui-backup-import.png'

type Props = {
  state: AppState
  setState: (updater: (s: AppState) => AppState) => void
  cloud: CloudSync
  onOpenDay: (key: string) => void
  /** Remplace les emojis des succès par leurs illustrations cyberpunk. */
  cyberpunkAchievementPreview?: boolean
  /** Active les icônes d'interface propres au thème cyberpunk. */
  cyberpunkUi?: boolean
  /** Illustrations optionnelles des quêtes, indexées par identifiant. */
  questIconImages?: Readonly<Record<string, string>>
}

export function Progression({
  state,
  setState,
  cloud,
  onOpenDay,
  cyberpunkAchievementPreview = false,
  cyberpunkUi = false,
  questIconImages,
}: Props) {
  const stats = useMemo(() => computeStats(state), [state])
  const fileRef = useRef<HTMLInputElement>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const unlocked = ACHIEVEMENTS.filter((a) => isUnlocked(a, stats))
  const sortedQuests = [...stats.perQuest].sort((a, b) => b.rate - a.rate)

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // permet de réimporter le même fichier
    if (!file) return
    file.text().then((text) => {
      const parsed = parseBackup(text)
      if (!parsed) {
        setNotice('❌ Fichier invalide — sauvegarde non importée.')
        return
      }
      const n = Object.keys(parsed.logs).length
      if (!confirm(`Importer cette sauvegarde ?\n${parsed.quests.length} quêtes, ${n} jours.\n\n⚠️ Tes données actuelles seront remplacées.`)) return
      setState(() => parsed)
      setNotice('✅ Sauvegarde importée avec succès !')
    })
  }

  return (
    <div className="mt-4 space-y-6">
      {/* synchronisation cloud */}
      <CloudCard cloud={cloud} cyberpunkUi={cyberpunkUi} />

      {/* rappel quotidien */}
      <ReminderCard cloud={cloud} state={state} setState={setState} cyberpunkUi={cyberpunkUi} />

      {/* heatmap annuelle */}
      <Heatmap state={state} onSelectDay={onOpenDay} />

      {/* bilan de la semaine */}
      <WeeklySummary state={state} />

      {/* résumé */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard label="Niveau" value={stats.level} accent="#818cf8" />
        <SummaryCard label="XP total" value={stats.totalXp} accent="#f472b6" />
        <SummaryCard label="Série actuelle" value={`${stats.currentStreak} j`} accent="#fb923c" />
        <SummaryCard label="Record de série" value={`${stats.bestStreak} j`} accent="#fbbf24" />
      </div>

      {/* badges */}
      <section>
        <div className="flex items-baseline justify-between mb-2 px-1">
          <h3 className="text-sm font-bold text-indigo-300">Succès</h3>
          <span className="text-xs text-slate-500">{unlocked.length}/{ACHIEVEMENTS.length} débloqués</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {ACHIEVEMENTS.map((a) => {
            const done = isUnlocked(a, stats)
            const value = a.value(stats)
            const achievementArt = cyberpunkAchievementPreview
              ? CYBERPUNK_ACHIEVEMENT_ART[a.id]
              : undefined
            return (
              <LifepathCard
                key={a.id}
                title={a.title}
                desc={a.desc}
                unlocked={done}
                progress={[value, a.target]}
                art={
                  achievementArt ? (
                    <>
                      <img src={achievementArt} alt="" />
                      {!done && <span className="hint">Verrouillé</span>}
                    </>
                  ) : (
                    <>
                      <span className="ico">{a.icon}</span>
                      {!done && <span className="hint">Verrouillé</span>}
                    </>
                  )
                }
              />
            )
          })}
        </div>
      </section>

      {/* statistiques par quête */}
      {sortedQuests.length > 0 && (
        <section>
          <h3 className="text-sm font-bold text-indigo-300 mb-2 px-1">
            Taux de réussite par quête
            <span className="text-slate-500 font-normal"> · {stats.trackedDays} jour{stats.trackedDays > 1 ? 's' : ''} suivi{stats.trackedDays > 1 ? 's' : ''}</span>
          </h3>
          <div className="glass rounded-2xl p-4 space-y-3">
            {sortedQuests.map(({ quest, completed, rate }) => (
              <div key={quest.id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="flex items-center gap-2 min-w-0">
                    {questIconImages?.[quest.id] ? (
                      <img
                        src={questIconImages[quest.id]}
                        alt=""
                        className="quest-stat-image"
                      />
                    ) : (
                      <span>{quest.icon}</span>
                    )}
                    <span className="truncate">{quest.label}</span>
                  </span>
                  <span className="text-xs text-slate-400 shrink-0">
                    {completed}× · <span className="font-bold" style={{ color: quest.color }}>{Math.round(rate * 100)}%</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.max(rate * 100, 2)}%`, background: quest.color, transition: 'width 0.6s ease-out' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* sauvegarde */}
      <section>
        <h3 className="text-sm font-bold text-indigo-300 mb-2 px-1">Sauvegarde de tes données</h3>
        <div className="glass rounded-2xl p-4">
          <p className="text-xs text-slate-400 mb-3">
            Tes données vivent uniquement sur cet appareil. Exporte une sauvegarde régulièrement
            pour ne rien perdre, ou pour la transférer sur un autre appareil.
          </p>
          <div className={`flex flex-col sm:flex-row gap-2 ${cyberpunkUi ? 'cp-backup-actions' : ''}`}>
            <button
              onClick={() => downloadBackup(state)}
              className={cyberpunkUi
                ? 'cp-backup-button cp-backup-button-export'
                : 'flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 py-2.5 font-semibold active:scale-[0.98] transition'}
            >
              {cyberpunkUi
                ? <img className="cp-backup-button-icon" src={cyberpunkBackupExportIcon} alt="" />
                : <span aria-hidden="true">⬇️</span>}
              <span>Exporter ma sauvegarde</span>
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className={cyberpunkUi
                ? 'cp-backup-button cp-backup-button-import'
                : 'flex-1 rounded-xl bg-white/5 hover:bg-white/10 py-2.5 font-semibold active:scale-[0.98] transition'}
            >
              {cyberpunkUi
                ? <img className="cp-backup-button-icon" src={cyberpunkBackupImportIcon} alt="" />
                : <span aria-hidden="true">⬆️</span>}
              <span>Importer une sauvegarde</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImport}
              className="hidden"
            />
          </div>
          {notice && <p className="text-xs mt-3 text-slate-300">{notice}</p>}
        </div>
      </section>
    </div>
  )
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function ReminderCard({
  cloud,
  state,
  setState,
  cyberpunkUi,
}: {
  cloud: CloudSync
  state: AppState
  setState: (u: (s: AppState) => AppState) => void
  cyberpunkUi: boolean
}) {
  const [deviceOn, setDeviceOn] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const time = state.settings?.reminderTime ?? '20:00'
  const [draftTime, setDraftTime] = useState(time)
  const [timeSaved, setTimeSaved] = useState(false)
  const timeDirty = draftTime !== time

  useEffect(() => {
    isPushEnabled().then(setDeviceOn)
  }, [])

  // resynchronise le brouillon si l'heure change depuis le cloud
  useEffect(() => {
    setDraftTime(time)
  }, [time])

  async function saveTime() {
    setBusy(true)
    setErr(null)
    const timezone = localTimezone()
    try {
      if (deviceOn) await schedulePush(draftTime, timezone)
      setState((s) => ({
        ...s,
        settings: { ...s.settings, reminderTime: draftTime, tz: timezone },
      }))
      setTimeSaved(true)
      setTimeout(() => setTimeSaved(false), 2500)
    } catch (e) {
      setErr((e as Error)?.message ?? 'Erreur')
    } finally {
      setBusy(false)
    }
  }

  if (!pushSupported) {
    return (
      <section className="glass rounded-2xl p-4">
        <h3 className="text-sm font-bold text-indigo-300 mb-1 flex items-center gap-2">
          <ProgressionHeadingIcon cyberpunkUi={cyberpunkUi} src={cyberpunkNotificationIcon} emoji="🔔" />
          <span>Rappel quotidien</span>
        </h3>
        <p className="text-xs text-slate-400">
          Les notifications ne sont pas supportées sur cet appareil/navigateur. Sur iPhone, installe
          d'abord l'app sur ton écran d'accueil.
        </p>
      </section>
    )
  }

  if (!cloud.user) {
    return (
      <section className="glass rounded-2xl p-4">
        <h3 className="text-sm font-bold text-indigo-300 mb-1 flex items-center gap-2">
          <ProgressionHeadingIcon cyberpunkUi={cyberpunkUi} src={cyberpunkNotificationIcon} emoji="🔔" />
          <span>Rappel quotidien</span>
        </h3>
        <p className="text-xs text-slate-400">Connecte-toi (ci-dessus) pour activer les rappels.</p>
      </section>
    )
  }

  async function toggle() {
    setBusy(true)
    setErr(null)
    try {
      if (deviceOn) {
        await disablePush(time, localTimezone())
        setDeviceOn(false)
        setState((s) => ({ ...s, settings: { ...s.settings, reminderEnabled: false } }))
      } else {
        const r = await enablePush(cloud.user!.id)
        if (!r.ok) {
          setErr(r.reason ?? 'Erreur')
          setBusy(false)
          return
        }
        await schedulePush(time, localTimezone())
        setDeviceOn(true)
        setState((s) => ({
          ...s,
          settings: { ...s.settings, reminderEnabled: true, reminderTime: time, tz: localTimezone() },
        }))
      }
    } catch (e) {
      setErr((e as Error)?.message ?? 'Erreur')
    }
    setBusy(false)
  }

  async function sendTest() {
    setBusy(true)
    setErr(null)
    try {
      await testPush(time, localTimezone())
      setTimeSaved(true)
      setTimeout(() => setTimeSaved(false), 2500)
    } catch (e) {
      setErr((e as Error)?.message ?? 'Erreur')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-indigo-300 mb-0.5 flex items-center gap-2">
            <ProgressionHeadingIcon cyberpunkUi={cyberpunkUi} src={cyberpunkNotificationIcon} emoji="🔔" />
            <span>Rappel quotidien</span>
          </h3>
          <p className="text-xs text-slate-400">
            {deviceOn ? 'Notification quotidienne programmée sur cet appareil.' : 'Active une notification pour ne pas oublier tes quêtes.'}
          </p>
        </div>
        <button
          onClick={toggle}
          disabled={busy}
          aria-pressed={deviceOn}
          className={`shrink-0 w-14 h-8 rounded-full p-1 transition disabled:opacity-50 ${deviceOn ? 'bg-emerald-500/80' : 'bg-white/10'}`}
        >
          <span className={`block w-6 h-6 rounded-full bg-white transition-transform ${deviceOn ? 'translate-x-6' : ''}`} />
        </button>
      </div>

      {deviceOn && (
        <div className="mt-3 pt-3 border-t border-white/8">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-slate-300">Heure du rappel</span>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={draftTime}
                onChange={(e) => setDraftTime(e.target.value)}
                className="rounded-lg bg-white/5 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-indigo-400/40"
              />
              <button
                onClick={saveTime}
                disabled={!timeDirty || busy}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition active:scale-[0.97] ${
                  timeDirty
                    ? 'bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white'
                    : 'bg-white/5 text-slate-500'
                }`}
              >
                Valider
              </button>
              <button
                onClick={sendTest}
                disabled={busy || timeDirty}
                className="rounded-lg border border-cyan-400/40 px-3 py-1.5 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/10 disabled:opacity-40"
              >
                Tester
              </button>
            </div>
          </div>
          {timeSaved && !timeDirty && (
            <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1 animate-pop">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Rappel réglé sur {time} ✓
            </p>
          )}
          {timeDirty && (
            <p className="text-xs text-amber-400 mt-2">Heure modifiée — clique sur « Valider » pour enregistrer.</p>
          )}
        </div>
      )}

      {err && <p className="text-xs text-red-400 mt-2">⚠️ {err}</p>}
    </section>
  )
}

function CloudCard({ cloud, cyberpunkUi }: { cloud: CloudSync; cyberpunkUi: boolean }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)

  async function submit() {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return
    setSending(true)
    const ok = await cloud.sendLink(email)
    setSending(false)
    if (ok) setSent(email.trim())
  }

  async function submitCode() {
    if (!sent || code.trim().length < 4) return
    setVerifying(true)
    const ok = await cloud.verify(sent, code)
    setVerifying(false)
    if (ok) {
      // connexion réussie → onAuthChange bascule la carte sur l'état « connecté »
      setSent(null)
      setCode('')
    }
  }

  // cloud non configuré
  if (!cloud.cloudEnabled) {
    return (
      <section className="glass rounded-2xl p-4">
        <h3 className="text-sm font-bold text-indigo-300 mb-1 flex items-center gap-2">
          <ProgressionHeadingIcon cyberpunkUi={cyberpunkUi} src={cyberpunkCloudIcon} emoji="☁️" />
          <span>Synchronisation cloud</span>
        </h3>
        <p className="text-xs text-slate-400">
          Pas encore configurée. Suis le guide <span className="text-slate-300 font-medium">NEON.md</span> pour
          activer la sauvegarde en ligne et l'accès multi-appareils.
        </p>
      </section>
    )
  }

  // connecté
  if (cloud.user) {
    return (
      <section className="glass rounded-2xl p-4" aria-live="polite">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-indigo-300 mb-0.5 flex items-center gap-2">
              <ProgressionHeadingIcon cyberpunkUi={cyberpunkUi} src={cyberpunkCloudIcon} emoji="☁️" />
              <span>Synchronisation cloud</span>
            </h3>
            <div className="mt-2 mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-1 text-xs font-bold text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_currentColor]" />
                Connexion confirmée
              </span>
              <span className="text-xs text-slate-400 truncate">{cloud.user.email}</span>
            </div>
            <p className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-2 text-xs">
              {cloud.status === 'syncing' && <span className="text-amber-400">⟳ Synchronisation…</span>}
              {cloud.status === 'offline' && <span className="text-amber-400">Hors ligne — reprise automatique</span>}
              {cloud.status === 'synced' && (
                <span className="text-emerald-400">
                  ✓ Données sauvegardées sur Neon{cloud.lastSync ? ` à ${formatTime(cloud.lastSync)}` : ''}
                </span>
              )}
              {cloud.status === 'error' && <span className="text-red-400">⚠️ {cloud.error}</span>}
            </p>
          </div>
          <div className="shrink-0 flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => void cloud.sync()}
              disabled={cloud.status === 'syncing'}
              className="rounded-xl bg-white/5 hover:bg-white/10 px-3 py-2 text-sm font-medium disabled:opacity-40 active:scale-[0.97] transition"
            >
              Synchroniser
            </button>
            <button
              onClick={() => void cloud.signOut()}
              className="rounded-xl bg-white/5 hover:bg-white/10 px-3 py-2 text-sm font-medium active:scale-[0.97] transition"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </section>
    )
  }

  // déconnecté : code envoyé → saisie du code
  if (sent) {
    return (
      <section className="glass rounded-2xl p-4">
        <h3 className="text-sm font-bold text-indigo-300 mb-1 flex items-center gap-2">📧 Entre ton code</h3>
        <p className="text-xs text-slate-400 mb-3">
          Un code de connexion a été envoyé à <span className="text-slate-200 font-medium">{sent}</span>.
          Saisis-le ci-dessous pour synchroniser tes données. (Pense à regarder les spams.)
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitCode()}
            placeholder="Code à 6 chiffres"
            className="flex-1 rounded-xl bg-white/5 p-2.5 text-sm tracking-widest outline-none focus:ring-2 focus:ring-indigo-400/40"
          />
          <button
            onClick={submitCode}
            disabled={verifying || code.trim().length < 4}
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-2.5 font-semibold disabled:opacity-40 active:scale-[0.98] transition"
          >
            {verifying ? 'Connexion…' : 'Valider'}
          </button>
        </div>
        {cloud.error && <p className="text-xs text-red-400 mt-2">⚠️ {cloud.error}</p>}
        <button
          onClick={() => {
            setSent(null)
            setCode('')
          }}
          className="text-xs text-indigo-300 mt-2 underline"
        >
          Utiliser une autre adresse
        </button>
      </section>
    )
  }

  // déconnecté : formulaire
  return (
    <section className="glass rounded-2xl p-4">
      <h3 className="text-sm font-bold text-indigo-300 mb-1 flex items-center gap-2">
        <ProgressionHeadingIcon cyberpunkUi={cyberpunkUi} src={cyberpunkCloudIcon} emoji="☁️" />
        <span>Synchronisation cloud</span>
      </h3>
      <p className="text-xs text-slate-400 mb-3">
        Connecte-toi pour sauvegarder tes données en ligne et les retrouver sur tous tes appareils.
        Tu recevras un code de connexion par email.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="ton@email.com"
          className="flex-1 rounded-xl bg-white/5 p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400/40"
        />
        <button
          onClick={submit}
          disabled={sending || !/^\S+@\S+\.\S+$/.test(email.trim())}
          className="rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-2.5 font-semibold disabled:opacity-40 active:scale-[0.98] transition"
        >
          {sending ? 'Envoi…' : 'Recevoir le code'}
        </button>
      </div>
      {cloud.error && <p className="text-xs text-red-400 mt-2">⚠️ {cloud.error}</p>}
    </section>
  )
}

function ProgressionHeadingIcon({
  cyberpunkUi,
  src,
  emoji,
}: {
  cyberpunkUi: boolean
  src: string
  emoji: string
}) {
  return cyberpunkUi
    ? <img className="cp-ui-heading-icon" src={src} alt="" />
    : <span aria-hidden="true">{emoji}</span>
}

function SummaryCard({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div className="glass rounded-2xl p-3 text-center">
      <div className="text-2xl font-extrabold" style={{ color: accent }}>{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-slate-500 mt-0.5">{label}</div>
    </div>
  )
}
