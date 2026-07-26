import Stripe from "stripe";
import { Pool, type QueryResultRow } from "pg";

export const paymentStatuses = [
  "pending",
  "paid",
  "failed",
  "expired",
  "refunded",
] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];
export type PaymentRecord = {
  id: string;
  proposalId: string;
  leadId: string;
  kind: "deposit" | "balance";
  status: PaymentStatus;
  amount: number;
  currency: string;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  checkoutUrl: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  failedAt: string | null;
  expiredAt: string | null;
  refundedAt: string | null;
};
export type PaymentContext = {
  proposalId: string;
  leadId: string;
  proposalStatus: string;
  proposalTitle: string;
  total: number;
  amountPaid: number;
  businessName: string;
  email: string;
};
export type Queryable = {
  query(
    sql: string,
    values?: unknown[],
  ): Promise<{ rows: QueryResultRow[]; rowCount?: number | null }>;
};
let pool: Pool | undefined, stripeClient: Stripe | undefined;
const db = () => {
  if (!process.env.DATABASE_URL) throw Error("DATABASE_URL is not configured");
  return (pool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
  })) as unknown as Queryable;
};
export const stripe = () => {
  if (!process.env.STRIPE_SECRET_KEY)
    throw Error("STRIPE_SECRET_KEY is not configured");
  return (stripeClient ??= new Stripe(process.env.STRIPE_SECRET_KEY));
};
const iso = (v: unknown) =>
  v ? new Date(v as string | number | Date).toISOString() : null;
const map = (r: QueryResultRow): PaymentRecord => ({
  id: r.id,
  proposalId: r.proposal_id,
  leadId: r.lead_id,
  kind: r.kind,
  status: r.status,
  amount: r.amount,
  currency: r.currency,
  stripeCheckoutSessionId: r.stripe_checkout_session_id,
  stripePaymentIntentId: r.stripe_payment_intent_id,
  checkoutUrl: r.checkout_url,
  createdAt: iso(r.created_at)!,
  updatedAt: iso(r.updated_at)!,
  paidAt: iso(r.paid_at),
  failedAt: iso(r.failed_at),
  expiredAt: iso(r.expired_at),
  refundedAt: iso(r.refunded_at),
});
export async function getPaymentContext(
  proposalId: string,
  q: Queryable = db(),
) {
  const r = await q.query(
    "select p.id proposal_id,p.lead_id,p.status proposal_status,p.title proposal_title,p.total,p.amount_paid,l.business_name,l.email from crm_proposals p join crm_leads l on l.id=p.lead_id where p.id=$1",
    [proposalId],
  );
  if (!r.rows[0]) return null;
  const x = r.rows[0];
  return {
    proposalId: x.proposal_id,
    leadId: x.lead_id,
    proposalStatus: x.proposal_status,
    proposalTitle: x.proposal_title,
    total: x.total,
    amountPaid: x.amount_paid,
    businessName: x.business_name,
    email: x.email,
  } as PaymentContext;
}
export async function listPayments(proposalId: string, q: Queryable = db()) {
  const r = await q.query(
    "select * from crm_payments where proposal_id=$1 order by created_at desc",
    [proposalId],
  );
  return r.rows.map(map);
}
export function calculatePaymentAmount(
  context: PaymentContext,
  kind: "deposit" | "balance",
  requested?: number,
) {
  if (context.proposalStatus !== "accepted")
    throw Error("PROPOSAL_NOT_ACCEPTED");
  const remaining = context.total - context.amountPaid;
  if (remaining <= 0) throw Error("PROPOSAL_ALREADY_PAID");
  if (kind === "balance") return remaining;
  const amount = requested ?? Math.max(1, Math.round(context.total / 2));
  if (!Number.isInteger(amount) || amount < 1 || amount > remaining)
    throw Error("INVALID_PAYMENT_AMOUNT");
  return amount;
}
export async function createCheckout(
  proposalId: string,
  input: { kind: "deposit" | "balance"; amount?: number },
  origin: string,
  q: Queryable = db(),
  client = stripe(),
) {
  const context = await getPaymentContext(proposalId, q);
  if (!context) throw Error("PROPOSAL_NOT_FOUND");
  const amount = calculatePaymentAmount(context, input.kind, input.amount),
    existing = await q.query(
      "select * from crm_payments where proposal_id=$1 and kind=$2 and amount=$3 and status='pending' and checkout_url is not null order by created_at desc limit 1",
      [proposalId, input.kind, amount],
    );
  if (existing.rows[0]) return map(existing.rows[0]);
  const id = crypto.randomUUID();
  await q.query(
    "insert into crm_payments(id,proposal_id,lead_id,kind,amount) values($1,$2,$3,$4,$5)",
    [id, proposalId, context.leadId, input.kind, amount],
  );
  try {
    const session = await client.checkout.sessions.create(
      {
        mode: "payment",
        customer_email: context.email,
        client_reference_id: proposalId,
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: amount,
              product_data: {
                name: `${input.kind === "deposit" ? "Deposit" : "Remaining balance"}: ${context.proposalTitle}`,
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          paymentId: id,
          proposalId,
          leadId: context.leadId,
          kind: input.kind,
        },
        payment_intent_data: {
          metadata: {
            paymentId: id,
            proposalId,
            leadId: context.leadId,
            kind: input.kind,
          },
        },
        success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/payment/cancelled?proposal=${proposalId}`,
      },
      { idempotencyKey: `crm-payment-${id}` },
    );
    const r = await q.query(
      "update crm_payments set stripe_checkout_session_id=$1,checkout_url=$2,updated_at=now() where id=$3 returning *",
      [session.id, session.url, id],
    );
    await syncPaymentSummary(proposalId, context.leadId, q);
    return map(r.rows[0]);
  } catch (error) {
    await q.query(
      "update crm_payments set status='failed',failed_at=now(),updated_at=now() where id=$1",
      [id],
    );
    throw error;
  }
}
async function syncPaymentSummary(
  proposalId: string,
  leadId: string,
  q: Queryable,
) {
  const totals = await q.query(
      "select coalesce(sum(amount) filter(where status='paid'),0)::int paid,bool_or(status='pending') pending,bool_or(status='pending' and kind='balance') balance_pending,bool_or(status='refunded') refunded from crm_payments where proposal_id=$1",
      [proposalId],
    ),
    proposal = await q.query("select total from crm_proposals where id=$1", [
      proposalId,
    ]),
    x = totals.rows[0],
    total = Number(proposal.rows[0]?.total ?? 0),
    paid = Number(x.paid),
    status =
      x.refunded && paid === 0
        ? "refunded"
        : paid >= total && total > 0
          ? "paid"
          : x.balance_pending
            ? "balance_pending"
            : paid > 0
            ? "deposit_paid"
            : x.pending
              ? "deposit_pending"
              : "failed";
  await q.query(
    "update crm_proposals set amount_paid=$1,payment_status=$2,updated_at=now() where id=$3",
    [paid, status, proposalId],
  );
  await q.query(
    "update crm_leads set payment_status=$1,updated_at=now() where id=$2",
    [status, leadId],
  );
}
export async function processStripeEvent(
  event: Stripe.Event,
  q: Queryable = db(),
) {
  const inserted = await q.query(
    "insert into stripe_webhook_events(event_id,event_type) values($1,$2) on conflict do nothing returning event_id",
    [event.id, event.type],
  );
  if (!inserted.rows[0]) return { duplicate: true };
  try {
    const object = event.data.object as Stripe.Checkout.Session | Stripe.Charge,
      paymentId = "metadata" in object ? object.metadata?.paymentId : undefined;
    let payment: QueryResultRow | undefined;
    if (paymentId) {
      const found = await q.query("select * from crm_payments where id=$1", [
        paymentId,
      ]);
      payment = found.rows[0];
    } else if ("payment_intent" in object && object.payment_intent) {
      const found = await q.query(
        "select * from crm_payments where stripe_payment_intent_id=$1",
        [
          typeof object.payment_intent === "string"
            ? object.payment_intent
            : object.payment_intent.id,
        ],
      );
      payment = found.rows[0];
    }
    if (payment) {
      if (
        [
          "checkout.session.completed",
          "checkout.session.async_payment_succeeded",
        ].includes(event.type)
      ) {
        const session = object as Stripe.Checkout.Session;
        if (session.payment_status !== "unpaid")
          await q.query(
            "update crm_payments set status='paid',stripe_payment_intent_id=$1,paid_at=coalesce(paid_at,now()),updated_at=now() where id=$2 and status<>'refunded'",
            [
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : null,
              payment.id,
            ],
          );
      } else if (event.type === "checkout.session.async_payment_failed")
        await q.query(
          "update crm_payments set status='failed',failed_at=now(),updated_at=now() where id=$1 and status='pending'",
          [payment.id],
        );
      else if (event.type === "checkout.session.expired")
        await q.query(
          "update crm_payments set status='expired',expired_at=now(),updated_at=now() where id=$1 and status='pending'",
          [payment.id],
        );
      else if (event.type === "charge.refunded")
        await q.query(
          "update crm_payments set status='refunded',refunded_at=now(),updated_at=now() where id=$1",
          [payment.id],
        );
      await syncPaymentSummary(payment.proposal_id, payment.lead_id, q);
    }
    await q.query(
      "update stripe_webhook_events set processed_at=now() where event_id=$1",
      [event.id],
    );
    return { duplicate: false };
  } catch (error) {
    await q.query(
      "update stripe_webhook_events set processing_error=$1 where event_id=$2",
      [
        error instanceof Error ? error.message.slice(0, 1000) : "Unknown error",
        event.id,
      ],
    );
    throw error;
  }
}
