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
  if (!hasProductDiscountClass) {
    return { operations: [] };
  }

  const { products = [], minQty, percentOff } = JSON.parse(input.shop.metafield?.value || '{}') || {};
  const filteredCandidates = input.cart.lines
    .filter(line => (
      line.merchandise.__typename === 'ProductVariant' &&
      products.includes(line.merchandise.product.id) &&
      line.quantity >= minQty
    ));

  const candidates = filteredCandidates.map(line => ({
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
