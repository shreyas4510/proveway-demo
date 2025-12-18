import {
  DiscountClass,
  ProductDiscountSelectionStrategy,
  CartInput,
  CartLinesDiscountsGenerateRunResult,
} from '../generated/api';

export function cartLinesDiscountsGenerateRun(
  input: CartInput,
): CartLinesDiscountsGenerateRunResult {

  if (!input.cart.lines.length) {
    return { operations: [] };
  }

  const hasProductDiscountClass = input.discount.discountClasses.includes(DiscountClass.Product);
  if (
    !hasProductDiscountClass ||
    !input.shop.metafield?.value
  ) {
    return { operations: [] };
  }

  let rules;
  try {
    rules = JSON.parse(input.shop.metafield.value);
  } catch {
    return { operations: [] };
  }

  const { products, minQty, percentOff } = rules;

  if (
    !Array.isArray(products) ||
    products.length === 0 ||
    typeof minQty !== 'number' ||
    minQty < 2 ||
    typeof percentOff !== 'number' ||
    percentOff <= 0
  ) {
    return { operations: [] };
  }

  const candidates = input.cart.lines
    .filter(line => (
      line.merchandise.__typename === 'ProductVariant' &&
      products.includes(line.merchandise.product.id) &&
      line.quantity >= minQty
    ))
    .map(line => ({
      message: `Buy ${minQty}, get ${percentOff}% off`,
      targets: [{ cartLine: { id: line.id } }],
      value: {
        percentage: {
          value: Number(percentOff)
        }
      }
    }));

  if (candidates.length === 0) {
    return { operations: [] };
  }

  return {
    operations: [
      {
        productDiscountsAdd: {
          candidates: candidates,
          selectionStrategy: ProductDiscountSelectionStrategy.All
        }
      }
    ]
  };
}
