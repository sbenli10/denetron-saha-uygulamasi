import { serve } from "https://deno.land/std/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.5.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_KEY")!
);

serve(async (req) => {
  const sig = req.headers.get("stripe-signature")!;
  const body = await req.text();

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!
    );
  } catch (err) {
    return new Response(`Invalid signature: ${err.message}`, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;

      const orgId = session.metadata.org_id;

      if (!orgId) {
        console.error("Missing org_id in metadata");
        break;
      }

      const { error } = await supabase
        .from("organizations")
        .update({
          is_premium: true,
          premium_activated_at: new Date().toISOString(),
        })
        .eq("id", orgId);

      if (error) console.error(error);

      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const orgId = subscription.metadata.org_id;

      if (!orgId) break;

      await supabase
        .from("organizations")
        .update({
          is_premium: false,
        })
        .eq("id", orgId);

      break;
    }

    default:
      console.log("Unhandled event type", event.type);
  }

  return new Response("ok", { status: 200 });
});
