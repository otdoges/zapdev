import { feature, product, featureItem, priceItem } from "atmn";

export const messages = feature({
  id: "messages",
  name: "Messages",
  type: "single_use",
});

export const free = product({
  id: "free",
  name: "Free",
  items: [
    featureItem({
      feature_id: messages.id,
      included_usage: 5,
      interval: "month",
    }),
  ],
});

export const pro = product({
  id: "pro",
  name: "Pro",
  items: [
    featureItem({
      feature_id: messages.id,
      included_usage: 100,
      interval: "month",
    }),
    priceItem({
      price: 20,
      interval: "month",
    }),
  ],
});