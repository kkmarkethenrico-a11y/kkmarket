import { SITE_URL } from '@/lib/resend/client'

type EmailLayoutParams = {
  preheader?: string
  title: string
  body: string
  cta?: { label: string; href: string }
  footerNote?: string
}

export function emailLayout({
  preheader,
  title,
  body,
  cta,
  footerNote,
}: EmailLayoutParams): string {
  const ctaBlock = cta
    ? `<p style="margin:28px 0 0">
        <a href="${cta.href}" style="display:inline-block;background:#7C3AED;color:#fff;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:10px;font-size:14px">
          ${cta.label}
        </a>
      </p>`
    : ''

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0d1322;font-family:Arial,Helvetica,sans-serif">
  ${preheader ? `<span style="display:none;max-height:0;overflow:hidden">${preheader}</span>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1322;padding:32px 16px">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#151b2b;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden">
          <tr>
            <td style="padding:28px 32px 12px;border-bottom:1px solid rgba(255,255,255,0.06)">
              <div style="font-size:20px;font-weight:800;color:#4cd7f6;letter-spacing:0.04em">KKMARKET</div>
              <div style="font-size:11px;color:#869397;margin-top:4px;text-transform:uppercase;letter-spacing:0.12em">Marketplace Digital</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px">
              <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#dde2f8">${title}</h1>
              <div style="font-size:15px;line-height:1.7;color:#bcc9cd">${body}</div>
              ${ctaBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid rgba(255,255,255,0.06)">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#869397">
                ${footerNote ?? 'Este é um e-mail automático da KKmarket. Não responda diretamente a esta mensagem.'}
              </p>
              <p style="margin:12px 0 0;font-size:12px;color:#869397">
                <a href="${SITE_URL}" style="color:#7C3AED;text-decoration:none">${SITE_URL.replace(/^https?:\/\//, '')}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
