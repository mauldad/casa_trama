import type { APIRoute } from 'astro';
import { json, requireSession, requireSessionAndCsrf } from '@/lib/account/http';
import { getWooCustomer, updateWooCustomer } from '@/lib/account/woo-customer';

export const GET: APIRoute = async ({ request }) => {
  const session = await requireSession(request);
  if (session instanceof Response) return session;

  try {
    const customer = await getWooCustomer(session.customerId);
    return json({
      id: customer.id,
      email: customer.email,
      firstName: customer.first_name || session.firstName,
      lastName: customer.last_name || session.lastName,
      phone: customer.billing?.phone || '',
      csrf: session.csrf,
    });
  } catch (error) {
    console.error('[account/me GET]', error);
    return json(
      {
        id: session.customerId,
        email: session.email,
        firstName: session.firstName,
        lastName: session.lastName,
        phone: '',
        csrf: session.csrf,
      },
      200,
    );
  }
};

export const PATCH: APIRoute = async ({ request }) => {
  const session = await requireSessionAndCsrf(request);
  if (session instanceof Response) return session;

  try {
    const body = (await request.json()) as {
      firstName?: string;
      lastName?: string;
      phone?: string;
    };
    const firstName = String(body.firstName || '').trim();
    const lastName = String(body.lastName || '').trim();
    const phone = String(body.phone || '').trim();

    const customer = await updateWooCustomer(session.customerId, {
      first_name: firstName,
      last_name: lastName,
      billing: {
        first_name: firstName,
        last_name: lastName,
        phone,
        email: session.email,
      },
    });

    return json({
      id: customer.id,
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
      phone: customer.billing?.phone || phone,
      csrf: session.csrf,
    });
  } catch (error) {
    console.error('[account/me PATCH]', error);
    return json({ error: 'No pudimos guardar tus datos.' }, 500);
  }
};
