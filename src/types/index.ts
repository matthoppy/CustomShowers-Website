/**
 * Central export for all type definitions
 */

// Design types
export type {
  GlassType,
  GlassThickness,
  ConfigurationType,
  DoorType,
  DoorOpening,
  HardwareFinish,
  DesignStatus,
  Measurements,
  DesignOptions,
  Design,
  DesignFormData,
  DesignValidationError,
} from './design';

export { DESIGN_CONSTRAINTS } from './design';

// Order types
export type {
  OrderStatus,
  PaymentStatus,
  QuoteStatus,
  Address,
  Customer,
  AdditionalCost,
  Quote,
  Order,
  OrderStatusHistory,
  OrderSummary,
  PaymentIntentData,
  CheckoutSession,
} from './order';

// Hardware types
export type {
  HardwareSupplier,
  HardwareCategory,
  HardwareSpecification,
  HardwareItem,
  HardwareCatalogItem,
  HardwareSelection,
  HardwareRequirements,
  HardwareSpecDocument,
  HingeType,
  HandleType,
  ChannelType,
  SealType,
} from './hardware';
