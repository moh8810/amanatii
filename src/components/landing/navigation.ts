export const navLinks = [
  { label: "الرئيسية", href: "/#home" },
  { label: "خدماتنا", href: "/#services" },
  { label: "كيف تعمل أمانتي", href: "/#how" },
  { label: "تتبع الشحنة", href: "/#tracking" },
  { label: "عن أمانتي", href: "/#why" },
  { label: "تواصل معنا", href: "/#contact" },
] as const;

export const actionRoutes = {
  login: "/login",
  getStarted: "/register",
  sendShipment: "/shipments/new",
  trackShipment: "/#tracking",
  createAccount: "/register",
  contact: "/#contact",
} as const;
