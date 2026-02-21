export default function StatCard({ icon, label, value, sub }: { icon: string; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-craft-card border border-craft-border rounded-xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{icon}</span>
        <span className="text-sm text-craft-muted">{label}</span>
      </div>
      <div className="text-2xl font-bold text-craft-gold">{value}</div>
      {sub && <p className="text-xs text-craft-muted mt-1">{sub}</p>}
    </div>
  )
}
