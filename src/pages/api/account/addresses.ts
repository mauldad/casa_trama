import type { APIRoute } from 'astro';
import { json, requireSession, requireSessionAndCsrf } from '@/lib/account/http';
import { getWooCustomer, updateWooCustomer } from '@/lib/account/woo-customer';

export const GET: APIRoute = async ({ request }) => {
  const session = await requireSession(request);
  if (session instanceof Response) return session;

  try {
    const customer = await getWooCustomer(session.customerId);
    return json({
      billing: customer.billing,
      shipping: customer.shipping,
      csrf: session.csrf,
    });
  } catch (error) {
    console.error('[account/addresses GET]', error);
    return json({ error: 'No pudimos cargar las direcciones.' }, 500);
  }
};

export const PATCH: APIRoute = async ({ request }) => {
  const session = await requireSessionAndCsrf(request);
  if (session instanceof Response) return session;

  try {
    const body = (await request.json()) as {
      billing?: Record<string, string>;
      shipping?: Record<string, string>;
    };

    const customer = await updateWooCustomer(session.customerId, {
      billing: body.billing
        ? {
            ...body.billing,
            email: session.email,
            country: body.billing.country || 'CL',
          }
        : undefined,
      shipping: body.shipping
        ? {
            ...body.shipping,
            country: body.shipping.country || 'CL',
          }
        : undefined,
    });

    return json({
      billing: customer.billing,
      shipping: customer.shipping,
      csrf: session.csrf,
    });
  } catch (error) {
    console.error('[account/addresses PATCH]', error);
    return json({ error: 'No pudimos guardar las direcciones.' }, 500);
  }
};
