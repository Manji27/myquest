import type { Achievement } from '../lib/achievements'

/** Notification affichée quand un succès est débloqué. */
export function AchievementToast({ achievement, onClose }: { achievement: Achievement; onClose: () => void }) {
  return (
    <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4 pointer-events-none">
      <button
        onClick={onClose}
        className="pointer-events-auto animate-pop glass rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl border border-indigo-400/40 bg-indigo-500/15 max-w-sm w-full"
      >
        <span className="text-3xl shrink-0">{achievement.icon}</span>
        <div className="text-left min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-wide text-indigo-300">
            🏆 Succès débloqué
          </div>
          <div className="font-bold truncate">{achievement.title}</div>
          <div className="text-xs text-slate-300 truncate">{achievement.desc}</div>
        </div>
      </button>
    </div>
  )
}
