import { Resend } from 'resend';

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@iris.app';
const APP_URL = process.env.FRONTEND_URL || 'https://app.estrategize.co';

interface NotifyNewResponseParams {
  to: string;
  cc?: string;
  applicationTitle: string;
  applicationId: string;
  responseId: string;
  answers: Array<{ field_title: string; value: unknown }>;
  submittedAt: string;
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ');
  if (value === null || value === undefined) return '—';
  return String(value);
}

export async function notifyNewResponse(params: NotifyNewResponseParams): Promise<void> {
  if (!process.env.RESEND_API_KEY) return; // silently skip if not configured
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { to, cc, applicationTitle, applicationId, responseId, answers, submittedAt } = params;

  const answersRows = answers
    .filter((a) => a.value !== null && a.value !== undefined)
    .map(
      (a) => `
      <tr>
        <td style="padding:8px 16px;border-bottom:1px solid #1a1a2e;color:#8e8ea0;font-size:13px;vertical-align:top;white-space:nowrap;">${a.field_title}</td>
        <td style="padding:8px 16px;border-bottom:1px solid #1a1a2e;color:#f5f5f7;font-size:13px;">${formatValue(a.value)}</td>
      </tr>`,
    )
    .join('');

  const formattedDate = new Date(submittedAt).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Inter',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="background:#111118;border:1px solid #1a1a2e;border-radius:16px;overflow:hidden;">
      <!-- Header -->
      <div style="padding:24px 32px;border-bottom:1px solid #1a1a2e;display:flex;align-items:center;gap:12px;">
        <div style="width:32px;height:32px;background:#7c5cfc;border-radius:8px;display:flex;align-items:center;justify-content:center;">
          <span style="color:#fff;font-size:16px;font-weight:700;">◉</span>
        </div>
        <span style="color:#f5f5f7;font-size:15px;font-weight:600;">Iris</span>
      </div>
      <!-- Body -->
      <div style="padding:28px 32px;">
        <p style="margin:0 0 4px;color:#8e8ea0;font-size:12px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;">Nova Resposta</p>
        <h1 style="margin:0 0 20px;color:#f5f5f7;font-size:22px;font-weight:700;letter-spacing:-0.02em;">${applicationTitle}</h1>
        <p style="margin:0 0 24px;color:#8e8ea0;font-size:13px;">Recebida em ${formattedDate}</p>
        <table style="width:100%;border-collapse:collapse;background:#0a0a0a;border-radius:10px;overflow:hidden;border:1px solid #1a1a2e;">
          <thead>
            <tr>
              <th style="padding:10px 16px;text-align:left;color:#5e5e7a;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;border-bottom:1px solid #1a1a2e;">Campo</th>
              <th style="padding:10px 16px;text-align:left;color:#5e5e7a;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;border-bottom:1px solid #1a1a2e;">Resposta</th>
            </tr>
          </thead>
          <tbody>${answersRows}</tbody>
        </table>
        <div style="margin-top:28px;text-align:center;">
          <a href="${APP_URL}/aplicacoes/${applicationId}/respostas" style="display:inline-block;padding:12px 28px;background:#7c5cfc;color:#fff;font-size:14px;font-weight:600;text-decoration:none;border-radius:10px;letter-spacing:-0.01em;">
            Ver todas as respostas →
          </a>
        </div>
      </div>
      <!-- Footer -->
      <div style="padding:16px 32px;border-top:1px solid #1a1a2e;text-align:center;">
        <p style="margin:0;color:#3e3e5a;font-size:11px;">Enviado por Iris ◉ · <a href="${APP_URL}" style="color:#5e5e7a;text-decoration:none;">app.estrategize.co</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;

  try {
    const payload: {
      from: string;
      to: string;
      cc?: string;
      subject: string;
      html: string;
    } = {
      from: `Iris ◉ <${FROM_EMAIL}>`,
      to,
      subject: `Nova resposta em "${applicationTitle}"`,
      html,
    };
    if (cc) payload.cc = cc;
    await resend.emails.send(payload);
  } catch (err) {
    console.error('[emailNotificationService] Failed to send notification:', err);
    // Don't throw — email failure must not affect form submission
  }
}
