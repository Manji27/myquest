import { useMemo, useRef, useState } from 'react'
import type { AppState } from '../types'
import { computeStats } from '../lib/stats'
import { ACHIEVEMENTS, isUnlocked } from '../lib/achievements'
import { downloadBackup, parseBackup } from '../lib/backup'
import type { CloudSync } from '../lib/useCloudSync'

type Props = {
  state: AppState
  setState: (updater: (s: AppState) => AppState) => void
  cloud: CloudSync
}

export function Progression({ state, setState, cloud }: Props) {
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
      <CloudCard cloud={cloud} />

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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {ACHIEVEMENTS.map((a) => {
            const done = isUnlocked(a, stats)
            const value = a.value(stats)
            return (
              <div
                key={a.id}
                className={`rounded-2xl p-3 border transition ${
                  done
                    ? 'border-indigo-400/40 bg-indigo-500/10'
                    : 'border-white/8 bg-white/[0.03]'
                }`}
              >
                <div className={`text-2xl mb-1 ${done ? '' : 'grayscale opacity-40'}`}>{a.icon}</div>
                <div className={`text-sm font-semibold ${done ? 'text-white' : 'text-slate-400'}`}>
                  {a.title}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 leading-tight">{a.desc}</div>
                {done ? (
                  <div className="text-[11px] font-bold text-emerald-400 mt-1.5">✓ Débloqué</div>
                ) : (
                  <div className="mt-1.5">
                    <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-400/70"
                        style={{ width: `${Math.min((value / a.target) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {Math.min(value, a.target)} / {a.target}
                    </div>
                  </div>
                )}
              </div>
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
                    <span>{quest.icon}</span>
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
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => downloadBackup(state)}
              className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 py-2.5 font-semibold active:scale-[0.98] transition"
            >
              ⬇️ Exporter ma sauvegarde
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex-1 rounded-xl bg-white/5 hover:bg-white/10 py-2.5 font-semibold active:scale-[0.98] transition"
            >
              ⬆️ Importer une sauvegarde
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

function CloudCard({ cloud }: { cloud: CloudSync }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  async function submit() {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return
    setSending(true)
    const ok = await cloud.sendLink(email)
    setSending(false)
    if (ok) setSent(email.trim())
  }

  // cloud non configuré
  if (!cloud.cloudEnabled) {
    return (
      <section className="glass rounded-2xl p-4">
        <h3 className="text-sm font-bold text-indigo-300 mb-1 flex items-center gap-2">☁️ Synchronisation cloud</h3>
        <p className="text-xs text-slate-400">
          Pas encore configurée. Suis le guide <span className="text-slate-300 font-medium">SUPABASE.md</span> pour
          activer la sauvegarde en ligne et l'accès multi-appareils.
        </p>
      </section>
    )
  }

  // connecté
  if (cloud.user) {
    return (
      <section className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-indigo-300 mb-0.5 flex items-center gap-2">☁️ Synchronisation cloud</h3>
            <p className="text-xs text-slate-400 truncate">{cloud.user.email}</p>
            <p className="text-xs mt-1">
              {cloud.status === 'syncing' && <span className="text-amber-400">⟳ Synchronisation…</span>}
              {cloud.status === 'synced' && (
                <span className="text-emerald-400">
                  ✓ Synchronisé{cloud.lastSync ? ` à ${formatTime(cloud.lastSync)}` : ''}
                </span>
              )}
              {cloud.status === 'error' && <span className="text-red-400">⚠️ {cloud.error}</span>}
            </p>
          </div>
          <button
            onClick={() => cloud.signOut()}
            className="shrink-0 rounded-xl bg-white/5 hover:bg-white/10 px-3 py-2 text-sm font-medium active:scale-[0.97] transition"
          >
            Déconnexion
          </button>
        </div>
      </section>
    )
  }

  // déconnecté : lien envoyé
  if (sent) {
    return (
      <section className="glass rounded-2xl p-4">
        <h3 className="text-sm font-bold text-indigo-300 mb-1 flex items-center gap-2">📧 Vérifie tes emails</h3>
        <p className="text-xs text-slate-400">
          Un lien de connexion a été envoyé à <span className="text-slate-200 font-medium">{sent}</span>.
          Ouvre-le sur cet appareil pour synchroniser tes données. (Pense à regarder les spams.)
        </p>
        <button onClick={() => setSent(null)} className="text-xs text-indigo-300 mt-2 underline">
          Utiliser une autre adresse
        </button>
      </section>
    )
  }

  // déconnecté : formulaire
  return (
    <section className="glass rounded-2xl p-4">
      <h3 className="text-sm font-bold text-indigo-300 mb-1 flex items-center gap-2">☁️ Synchronisation cloud</h3>
      <p className="text-xs text-slate-400 mb-3">
        Connecte-toi pour sauvegarder tes données en ligne et les retrouver sur tous tes appareils.
        Tu recevras un lien de connexion par email.
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
          {sending ? 'Envoi…' : 'Recevoir le lien'}
        </button>
      </div>
      {cloud.error && <p className="text-xs text-red-400 mt-2">⚠️ {cloud.error}</p>}
    </section>
  )
}

function SummaryCard({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div className="glass rounded-2xl p-3 text-center">
      <div className="text-2xl font-extrabold" style={{ color: accent }}>{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-slate-500 mt-0.5">{label}</div>
    </div>
  )
}
