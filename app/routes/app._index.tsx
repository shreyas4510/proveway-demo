import { useEffect, useState } from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { admin } = await authenticate.admin(request);

    const shopResponse = await admin.graphql(`#graphql
      query {
        shop { id }
      }`);
    const shopData = await shopResponse.json();
    const shopId = shopData?.data?.shop?.id;

    if (!shopId) return { selectedProducts: [], discount: 10 };

    const metafieldResponse = await admin.graphql(
      `#graphql
        query GetVolumeDiscountConfig($namespace: String!, $key: String!) {
          shop {
            metafield(namespace: $namespace, key: $key) {
              value
            }
          }
        }`,
      { variables: { namespace: "volume_discount", key: "rules" } }
    );

    const metafieldJson = await metafieldResponse.json();
    const value = metafieldJson.data.shop.metafield?.value;

    if (!value) return { selectedProducts: [], discount: 10 };

    const parsed = JSON.parse(value);

    return {
      selectedProducts: parsed.products || [],
      discount: parsed.percentOff || 10,
    };
  } catch (err) {
    console.error(err);
    return { selectedProducts: [], discount: 10 };
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { admin } = await authenticate.admin(request);
    const body = await request.json();
    const { products = [], percentOff = 10 } = body;

    if (!products.length) {
      return { success: false, errors: [{ message: "No products selected" }] };
    }

    const shopResponse = await admin.graphql(`#graphql
      query { shop { id } }`);
    const shopData = await shopResponse.json();
    const shopId = shopData?.data?.shop?.id;

    if (!shopId) {
      return { success: false, errors: [{ message: "Could not retrieve Shop ID" }] };
    }

    const metafieldResponse = await admin.graphql(`#graphql
      mutation SaveDiscountConfig($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          userErrors { field message }
        }
      }`,
      {
        variables: {
          metafields: [
            {
              ownerId: shopId,
              namespace: "volume_discount",
              key: "rules",
              type: "json",
              value: JSON.stringify({
                products,
                minQty: 2,
                percentOff: Number(percentOff),
              }),
            },
          ],
        },
      }
    );

    const metafieldJson = await metafieldResponse.json();
    const errors = metafieldJson.data.metafieldsSet.userErrors;

    return {
      success: errors.length === 0,
      errors: errors,
    };
  } catch (err) {
    console.error(err);
    return { success: false, errors: [{ message: err.message }] };
  }
};

export default function Index() {
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const { selectedProducts, discount } = useLoaderData<typeof loader>();

  const [products, setProducts] = useState<string[]>(selectedProducts);
  const [percentOff, setPercentOff] = useState<string>(String(discount));

  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.success) {
        shopify.toast.show("Discount rules saved successfully!");
      } else if (fetcher.data.errors?.length) {
        shopify.toast.show(fetcher.data.errors[0].message);
      }
    }
  }, [fetcher.data]);

  const openPicker = async () => {
    const selection = await shopify.resourcePicker({
      type: "product",
      multiple: true,
    });

    if (selection) {
      setProducts(selection.map((p: any) => p.id));
    }
  };

  const saveConfig = () => {
    fetcher.submit(
      { products, percentOff: Number(percentOff) },
      { method: "POST", encType: "application/json" }
    );
  };

  return (
    <s-page heading="Volume Discount">
      <s-section>
        <s-button onClick={openPicker}>
          Select products ({products.length})
        </s-button>
      </s-section>

      <s-section>
        <s-number-field
          label="Discount percentage"
          min={1}
          max={80}
          value={percentOff}
          suffix="%"
          onInput={(e: any) => setPercentOff(e.target.value)}
        />
      </s-section>

      <s-section>
        <s-button variant="primary" onClick={saveConfig}>
          Save Discount
        </s-button>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
