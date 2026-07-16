const {
  getAllOffers,
  getOfferBySlug,
  getOfferRestaurants,
  getOfferItems,
  validateOfferEligibility,
} = require('../models/offerModel');
const { getCartByUserId, getCartItems } = require('../models/cartModel');

const listOffers = async (req, res) => {
  try {
    const offers = await getAllOffers();
    res.json({ success: true, message: 'Offers retrieved', data: offers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const getOffer = async (req, res) => {
  try {
    const offer = await getOfferBySlug(req.params.id);
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found', error: {} });
    }

    const restaurants = await getOfferRestaurants(offer.id);
    res.json({
      success: true,
      message: 'Offer retrieved',
      data: { ...offer, restaurants },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const getItems = async (req, res) => {
  try {
    const offer = await getOfferBySlug(req.params.id);
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found', error: {} });
    }

    const items = await getOfferItems(offer.id);
    const mapped = items.map((item) => {
      const originalPrice = parseFloat(item.price);
      const basePrice = item.discount_price ? parseFloat(item.discount_price) : originalPrice;
      let discountedPrice = basePrice;
      if (item.offer_discount_percent) {
        discountedPrice = basePrice * (1 - parseFloat(item.offer_discount_percent) / 100);
      }
      return {
        ...item,
        original_price: originalPrice,
        discounted_price: parseFloat(discountedPrice.toFixed(2)),
        rating: item.restaurant_rating || '4.5',
        delivery_time: `${item.estimated_delivery_time || 30} min`,
      };
    });

    res.json({ success: true, message: 'Offer items retrieved', data: mapped });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const validateOffer = async (req, res) => {
  try {
    const offer = await getOfferBySlug(req.params.id);
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found', error: {} });
    }

    const cart = await getCartByUserId(req.user.id);
    const items = await getCartItems(cart.id);
    let subtotal = 0;
    items.forEach((item) => {
      const price = item.discount_price ? parseFloat(item.discount_price) : parseFloat(item.price);
      subtotal += price * item.quantity;
    });

    const result = await validateOfferEligibility(offer, req.user.id, items, subtotal);
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.message, error: {} });
    }

    res.json({ success: true, message: 'Offer is valid for current cart', data: { offer_id: offer.id, coupon_code: offer.coupon_code } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = { listOffers, getOffer, getItems, validateOffer };
