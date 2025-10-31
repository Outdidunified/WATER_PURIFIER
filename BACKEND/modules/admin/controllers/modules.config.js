// modules.config.js (CommonJS)
module.exports = [
  { module: "dashboard", actions: ["create", "view", "update", "delete"] },
  { module: "manage_devices", actions: ["create", "view", "update", "delete"] },
  { module: "manage_users", actions: ["create", "view", "update", "delete"] },
  { module: "manage_roles", actions: ["create", "view", "update", "delete"] },
  { module: "manage_orders", actions: ["create", "view", "update", "delete"] },
  { module: "manage_products", actions: ["create", "view", "update", "delete"] },
  { module: "manage_services", actions: ["create", "view", "update", "delete"] },
  { module: "manage_requests", actions: ["create", "view", "update", "delete"] },
  { module: "manage_installations", actions: ["create", "view", "update", "delete"] },
  { module: "manage_contact", actions: ["create", "view", "update", "delete"] },
  { module: "manage_call_requests", actions: ["create", "view", "update", "delete"] },
  { module: "manage_leaves", actions: ["view", "update"] },
  { module: "profile", actions: ["view", "update"] },
];
