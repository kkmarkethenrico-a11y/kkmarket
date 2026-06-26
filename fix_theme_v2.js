const fs = require('fs');
const path = './app/globals.css';
let css = fs.readFileSync(path, 'utf8');

const newVars = `
:root, .dark {
  /* kkmarket Cyber-Nexus Marketplace theme */
  --gm-paper:    #0d1322;
  --gm-paper-2:  #151b2b;
  --gm-paper-3:  #191f2f;
  --gm-ink:      #dde2f8;
  --gm-ink-dim:  #bcc9cd;
  --gm-ink-faint:#869397;
  --gm-violet:   #7C3AED;
  --gm-cyan:     #4cd7f6;
  --gm-green:    #10b981;
  --gm-amber:    #ffc640;
  --gm-rose:     #fb7185;

  --background:  #0d1322;
  --foreground:  #dde2f8;
  --card:        #151b2b;
  --card-foreground: #dde2f8;
  --popover:     #151b2b;
  --popover-foreground: #dde2f8;
  --primary:     #ffc640;
  --primary-foreground: #402d00;
  --secondary:   #191f2f;
  --secondary-foreground: #dde2f8;
  --muted:       #191f2f;
  --muted-foreground: #bcc9cd;
  --accent:      #191f2f;
  --accent-foreground: #ffc640;
  --destructive: #ffb4ab;
  --border:      rgba(255, 255, 255, 0.1);
  --input:       rgba(255, 255, 255, 0.05);
  --ring:        #06b6d4;
  --chart-1:     #ffc640;
  --chart-2:     #4cd7f6;
  --chart-3:     #10b981;
  --chart-4:     #d0bcff;
  --chart-5:     #ffb4ab;
  --radius:      0.5rem;

  --sidebar:     #080e1d;
  --sidebar-foreground: #dde2f8;
  --sidebar-primary: #ffc640;
  --sidebar-primary-foreground: #402d00;
  --sidebar-accent: #151b2b;
  --sidebar-accent-foreground: #dde2f8;
  --sidebar-border: rgba(255, 255, 255, 0.1);
  --sidebar-ring: #4cd7f6;
}
`;

// replace existing :root and .dark blocks
css = css.replace(/:root\s*\{[\s\S]*?\}/, newVars);
css = css.replace(/\.dark\s*\{[\s\S]*?\}/, '');

fs.writeFileSync(path, css);
console.log('Updated globals.css');
