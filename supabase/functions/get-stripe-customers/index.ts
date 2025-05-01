import Stripe from 'npm:stripe@13.7.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const stripeSecretKey = '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';

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    let allCustomers = [];
    let hasMore = true;
    let lastCustomerId = undefined;

    // Fetch all customers using pagination
    while (hasMore) {
      const options: Stripe.CustomerListParams = {
        limit: 100,
        expand: ['data.default_source', 'data.sources'],
      };

      if (lastCustomerId) {
        options.starting_after = lastCustomerId;
      }

      const customers = await stripe.customers.list(options);
      allCustomers = allCustomers.concat(customers.data);
      hasMore = customers.has_more;

      if (hasMore && customers.data.length > 0) {
        lastCustomerId = customers.data[customers.data.length - 1].id;
      }
    }

    // Format the response to include payment method information
    const formattedCustomers = allCustomers
      .filter(customer => {
        // Check if customer has any valid payment methods
        const hasNoPaymentMethods = 
          !customer.default_source && // No default source
          (!customer.sources?.data || customer.sources.data.length === 0); // No sources
        
        return hasNoPaymentMethods;
      })
      .map(customer => ({
      id: customer.id,
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
      hasPaymentMethod: false, // These customers have no payment methods by definition
      defaultSource: customer.default_source,
      sources: customer.sources?.data || []
    }));

    return new Response(JSON.stringify(formattedCustomers), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200,
    });
  } catch (error) {
    console.error('Error fetching Stripe customers:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 500,
    });
  }
});