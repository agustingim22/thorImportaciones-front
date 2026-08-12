/** Datos del usuario seguros para exponer al cliente (sin passwordHash). */
export type PublicUser = {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  street: string | null;
  postalCode: string | null;
  city: string | null;
  province: string | null;
  floor: string | null;
  apartment: string | null;
};
