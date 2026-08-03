import type { Handler } from '@netlify/functions';
import { Resend } from 'resend';
import { requireUser, jsonResponse } from './_shared/supabaseAdmin';

const resend = new Resend(process.env.RESEND_API_KEY);

type EmailTemplate =
  | 'project_invite'
  | 'permission_approved'
  | 'permission_denied'
  | 'storage_limit'
  | 'plan_changed'
  | 'link_shared';

interface SendEmailBody {
  to: string | string[];
  template: EmailTemplate;
  data: Record<string, string>;
}

function renderTemplate(template: EmailTemplate, data: Record<string, string>): { subject: string; html: string } {
  const wrap = (title: string, body: string) => ({
    subject: title,
    html: `
      <div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
        <div style="font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 16px;">${title}</div>
        <div style="font-size: 14px; line-height: 1.6; color: #374151;">${body}</div>
        <div style="margin-top: 32px; font-size: 12px; color: #9ca3af;">Sent by SaaS Platform</div>
      </div>
    `,
  });

  switch (template) {
    case 'project_invite':
      return wrap(
        `You've been invited to ${data.projectName}`,
        `${data.inviterName} invited you to collaborate on <strong>${data.projectName}</strong> as ${data.role}. <br/><br/><a href="${data.link}" style="color:#2563eb;">Open project</a>`
      );
    case 'permission_approved':
      return wrap(
        'Access request approved',
        `Your request to access <strong>${data.projectName}</strong> was approved. <br/><br/><a href="${data.link}" style="color:#2563eb;">Open project</a>`
      );
    case 'permission_denied':
      return wrap('Access request denied', `Your request to access <strong>${data.projectName}</strong> was denied.`);
    case 'storage_limit':
      return wrap(
        'Storage limit reached',
        `You have reached your plan's storage limit. Upgrade your plan to continue uploading files. <br/><br/><a href="${data.link}" style="color:#2563eb;">Manage billing</a>`
      );
    case 'plan_changed':
      return wrap('Your plan has changed', `Your subscription is now on the <strong>${data.planName}</strong> plan.`);
    case 'link_shared':
      return wrap(
        'A file was shared with you',
        `${data.senderName} shared content from <strong>${data.projectName}</strong> with you. <br/><br/><a href="${data.link}" style="color:#2563eb;">View shared content</a>`
      );
    default:
      return wrap('Notification', 'You have a new notification.');
  }
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    await requireUser(event.headers.authorization);
    const body = JSON.parse(event.body || '{}') as SendEmailBody;

    if (!body.to || !body.template) {
      return jsonResponse(400, { error: 'to and template are required' });
    }

    const { subject, html } = renderTemplate(body.template, body.data || {});

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'SaaS Platform <no-reply@yourdomain.com>',
      to: body.to,
      subject,
      html,
    });

    return jsonResponse(200, { id: result.data?.id });
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return jsonResponse(401, { error: 'Unauthorized' });
    }
    return jsonResponse(500, { error: 'Failed to send email' });
  }
};
