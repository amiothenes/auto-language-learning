import { DoorScene } from '@/components/riso/scenes/Scenes';

// Auth pages (login, sign-up, password reset, saving a guest library) open on
// the story's first image: the green door of La Biblioteca del Olvido,
// framed like a riso print on the primary-green panel. (This replaced the
// earlier open-book drawing, so the auth screens share the onboarding world.)

export function AuthIllustration() {
  return (
    <figure className="w-full max-w-sm rounded-card overflow-hidden border border-paper/25 shadow-modal bg-paper rotate-[-1.5deg]">
      <DoorScene />
    </figure>
  );
}
