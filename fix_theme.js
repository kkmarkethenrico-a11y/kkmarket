const fs = require('fs');
const files = [
  'components/announcement/Step2Details.tsx',
  'components/announcement/Step3Images.tsx',
  'components/announcement/Step4Review.tsx'
];

const replacements = {
  'text-zinc-100': 'text-[var(--gm-ink)]',
  'text-zinc-200': 'text-[var(--gm-ink)]',
  'text-zinc-300': 'text-[var(--gm-ink)]',
  'text-zinc-400': 'text-[var(--gm-ink-faint)]',
  'text-zinc-500': 'text-[var(--gm-ink-faint)]/80',
  'border-zinc-800': 'border-[var(--gm-ink-faint)]/20',
  'border-zinc-700': 'border-[var(--gm-ink-faint)]/30',
  'bg-zinc-900/50': 'bg-[var(--gm-paper-3)]',
  'bg-zinc-900': 'bg-[var(--gm-paper-2)]',
  'bg-zinc-950/50': 'bg-[var(--gm-paper-3)]',
  'bg-zinc-950': 'bg-[var(--gm-paper)]',
  'text-white': 'text-[var(--gm-ink)]',
  'placeholder-zinc-500': 'placeholder:text-[var(--gm-ink-faint)]',
  'bg-violet-600': 'bg-[var(--gm-violet)]',
  'text-violet-300': 'text-[var(--gm-violet)]',
  'text-violet-400': 'text-[var(--gm-violet)]',
  'border-violet-500': 'border-[var(--gm-violet)]',
  'ring-violet-500': 'ring-[var(--gm-violet)]/50',
  'hover:bg-violet-500': 'hover:bg-[var(--gm-violet)]/80'
};

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  for (const [oldClass, newClass] of Object.entries(replacements)) {
    const regex = new RegExp(oldClass.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
    content = content.replace(regex, newClass);
  }
  fs.writeFileSync(file, content);
  console.log('Fixed', file);
});
