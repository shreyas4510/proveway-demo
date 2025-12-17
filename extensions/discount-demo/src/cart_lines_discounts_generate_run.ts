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

  const candidates = input.cart.lines
    .filter(line => line.quantity >= 2)
    .map(line => ({
      message: 'Buy 2, get 10% off',
      targets: [{ cartLine: { id: line.id } }],
      value: {
        percentage: {
          value: 10.0
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