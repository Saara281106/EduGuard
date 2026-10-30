import { avatarTone, initials } from '../lib/format.js'

export default function Avatar({ name = '', seed = '', size = 'md' }) {
  return (
    <span className={`avatar avatar-${size} ${avatarTone(seed || name)}`} aria-hidden="true">
      {initials(name) || '?'}
    </span>
  )
}
