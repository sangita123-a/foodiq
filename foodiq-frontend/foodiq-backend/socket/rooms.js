/** Room name helpers — emit only to relevant audiences. */

const userRoom = (userId) => `user:${userId}`;
const roleRoom = (role) => `role:${role}`;
const orderRoom = (orderId) => `order:${orderId}`;
const restaurantRoom = (restaurantId) => `restaurant:${restaurantId}`;
const deliveryRoom = (partnerId) => `delivery:${partnerId}`;

const ROLE_ROOMS = {
  customer: roleRoom('customer'),
  restaurant_owner: roleRoom('restaurant_owner'),
  delivery_partner: roleRoom('delivery_partner'),
  admin: roleRoom('admin'),
};

module.exports = {
  userRoom,
  roleRoom,
  orderRoom,
  restaurantRoom,
  deliveryRoom,
  ROLE_ROOMS,
};
