# Volume Discount Shopify App

This Shopify app implements a **volume-based automatic discount** using **Shopify Functions** and **shop-level metafields**, along with a **Theme App Extension** to display a dynamic discount message on product pages.

## Prerequisites

- Node.js 20.10 or higher
- Shopify Partner account
- Shopify dev store

## Install Shopify CLI:

```bash
npm install -g @shopify/cli@latest
```

## Setup & Run

### 1. Install dependencies
```bash
npm install
```

### 2. Start the app

```bash
shopify app dev
```

- Log in to your Shopify Partner account when prompted
- Select a development store
- Install the app on the store

### 3. Automatic Discount Setup (One-time)

After installing the app on a store, **one automatic discount must be created** to activate the function. Run the Admin GraphQL mutation.

```bash
mutation {
  discountAutomaticAppCreate(
    automaticAppDiscount: {
      title: "Buy 2 Get X% Off"
      functionHandle: "discount-function"
      discountClasses: [PRODUCT]
      startsAt: "2025-01-01T00:00:00"
    }
  ) {
    automaticAppDiscount {
      discountId
    }
    userErrors {
      field
      message
    }
  }
}
```
