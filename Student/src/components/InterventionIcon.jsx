import { BookOpen, HeartHandshake, Phone, UserRound, Wallet } from 'lucide-react'

const ICONS = {
  'Parent Call': Phone,
  'Remedial Classes': BookOpen,
  'Scholarship Assistance': Wallet,
  'Mentor Meeting': UserRound,
  Counselling: HeartHandshake,
}

export default function InterventionIcon({ type, size = 18 }) {
  const Icon = ICONS[type] || UserRound
  return <Icon size={size} strokeWidth={2} />
}
