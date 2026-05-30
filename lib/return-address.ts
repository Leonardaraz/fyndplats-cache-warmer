// Privat returadress — endast för server-renderade mejl till kunder som
// anmält en retur. Får INTE renderas i publik HTML eller exporteras till
// klientsidan. Bytena (postbox, ny adress) görs på ett enda ställe.

export const RETURN_ADDRESS = {
  name: "Leonard Araz",
  street: "Bergviksgatan 10",
  postalCode: "15244",
  city: "Södertälje",
  formatted: "Leonard Araz\nBergviksgatan 10\n15244 Södertälje",
};
