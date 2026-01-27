export function deliverableClaimedEmail({
  deliverableTitle,
  editorName,
  link,
}: {
  deliverableTitle: string;
  editorName: string;
  link: string;
}) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Deliverable Claimed</h2>
      <p><strong>${editorName}</strong> has claimed the brief for <strong>${deliverableTitle}</strong>.</p>
      <p>Work should begin shortly.</p>
      <p>
        <a href="${link}" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
          View Brief
        </a>
      </p>
    </div>
  `;
}

export function deliverableSubmittedEmail({
  deliverableTitle,
  editorName,
  link,
}: {
  deliverableTitle: string;
  editorName: string;
  link: string;
}) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Deliverable Submitted</h2>
      <p><strong>${editorName}</strong> has submitted work for <strong>${deliverableTitle}</strong>.</p>
      <p>It is now ready for internal review.</p>
      <p>
        <a href="${link}" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
          Review Submission
        </a>
      </p>
    </div>
  `;
}

export function clientRequestSubmittedEmail({
  clientName,
  subject,
  link,
}: {
  clientName: string;
  subject: string;
  link: string;
}) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>New Client Request</h2>
      <p><strong>${clientName}</strong> has submitted a new request:</p>
      <blockquote style="background: #f4f4f5; padding: 12px; border-left: 4px solid #000;">
        ${subject}
      </blockquote>
      <p>
        <a href="${link}" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
          View Request
        </a>
      </p>
    </div>
  `;
}

export function clientRequestReplyEmail({
  clientName,
  subject,
  message,
  link,
}: {
  clientName: string;
  subject: string;
  message: string;
  link: string;
}) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>New Reply on Request</h2>
      <p><strong>${clientName}</strong> replied to <strong>${subject}</strong>:</p>
      <blockquote style="background: #f4f4f5; padding: 12px; border-left: 4px solid #000;">
        ${message}
      </blockquote>
      <p>
        <a href="${link}" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
          View Thread
        </a>
      </p>
    </div>
  `;
}

export function deliverableReadyForApprovalEmail({
  deliverableTitle,
  campaignTitle,
  link,
}: {
  deliverableTitle: string;
  campaignTitle: string;
  link: string;
}) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Approval Required</h2>
      <p>A new deliverable for <strong>${campaignTitle}</strong> is ready for your review.</p>
      <p><strong>Item:</strong> ${deliverableTitle}</p>
      <p>Please review and approve or request changes.</p>
      <p>
        <a href="${link}" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
          Review Deliverable
        </a>
      </p>
    </div>
  `;
}

export function deliverableApprovedEmail({
  deliverableTitle,
  clientName,
  link,
}: {
  deliverableTitle: string;
  clientName: string;
  link: string;
}) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Deliverable Approved</h2>
      <p><strong>${clientName}</strong> has approved <strong>${deliverableTitle}</strong>.</p>
      <p>You can now proceed with publishing or the next steps.</p>
      <p>
        <a href="${link}" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
          View Deliverable
        </a>
      </p>
    </div>
  `;
}

export function deliverableRejectedEmail({
  deliverableTitle,
  clientName,
  feedback,
  link,
}: {
  deliverableTitle: string;
  clientName: string;
  feedback?: string;
  link: string;
}) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Changes Requested</h2>
      <p><strong>${clientName}</strong> has requested changes on <strong>${deliverableTitle}</strong>.</p>
      ${feedback ? `<blockquote style="background: #f4f4f5; padding: 12px; border-left: 4px solid #000;">${feedback}</blockquote>` : ""}
      <p>Please check the feedback and revise.</p>
      <p>
        <a href="${link}" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
          View Feedback
        </a>
      </p>
    </div>
  `;
}

export function deliverableStalledEmail({
  deliverableTitle,
  campaignTitle,
  link,
}: {
  deliverableTitle: string;
  campaignTitle: string;
  link: string;
}) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Action Required: Approval Pending</h2>
      <p>The deliverable <strong>${deliverableTitle}</strong> for <strong>${campaignTitle}</strong> has been waiting for your review for over 48 hours.</p>
      <p>Please review it to keep the campaign on schedule.</p>
      <p>
        <a href="${link}" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
          Review Now
        </a>
      </p>
    </div>
  `;
}

export function taskOverdueEmail({
  taskTitle,
  dueDate,
  link,
}: {
  taskTitle: string;
  dueDate: string;
  link: string;
}) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Task Overdue</h2>
      <p>The task <strong>${taskTitle}</strong> was due on <strong>${dueDate}</strong>.</p>
      <p>Please update the status or complete the task.</p>
      <p>
        <a href="${link}" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
          View Task
        </a>
      </p>
    </div>
  `;
}

export function taskAssignedEmail({
  taskTitle,
  assignedBy,
  link,
}: {
  taskTitle: string;
  assignedBy: string;
  link: string;
}) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>New Task Assigned</h2>
      <p><strong>${assignedBy}</strong> has assigned you a new task: <strong>${taskTitle}</strong>.</p>
      <p>
        <a href="${link}" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
          View Task
        </a>
      </p>
    </div>
  `;
}

export function invoiceSentEmail({
  invoiceNumber,
  amount,
  currency,
  dueDate,
  link,
}: {
  invoiceNumber: string;
  amount: number;
  currency: string;
  dueDate?: string;
  link: string;
}) {
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>New Invoice Available</h2>
      <p>A new invoice <strong>${invoiceNumber}</strong> has been generated.</p>
      <div style="background: #f4f4f5; padding: 16px; border-radius: 4px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0;"><strong>Amount:</strong> ${formattedAmount}</p>
        ${dueDate ? `<p style="margin: 0;"><strong>Due Date:</strong> ${dueDate}</p>` : ""}
      </div>
      <p>
        <a href="${link}" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
          View Invoice
        </a>
      </p>
    </div>
  `;
}
