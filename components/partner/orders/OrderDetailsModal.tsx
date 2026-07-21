"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Order } from "./types";
import { X, MapPin, Phone, User, Bike, CreditCard, Receipt } from "lucide-react";

interface OrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderDetailsModal({ order, isOpen, onClose }: OrderDetailsModalProps) {
  
  if (!order) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Right Drawer */}
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-section border-l border-border z-50 flex flex-col shadow-2xl"
          >
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-border flex items-center justify-between bg-background">
              <div>
                <h2 className="text-2xl font-black text-foreground flex items-center gap-2">
                  <Receipt className="w-6 h-6 text-primary" /> Order {order.id}
                </h2>
                <p className="text-gray-text text-sm mt-1">{order.orderTime}</p>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-section hover:bg-section flex items-center justify-center text-gray-text hover:text-foreground transition-colors border border-border"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
              
              {/* Customer Info */}
              <section>
                <h3 className="text-sm font-bold text-[#9CA3AF] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <User className="w-4 h-4" /> Customer Details
                </h3>
                <div className="bg-background rounded-2xl p-4 border border-border space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-foreground font-bold">{order.customerName}</p>
                      <p className="text-gray-text text-sm flex items-center gap-1 mt-1"><Phone className="w-3 h-3"/> {order.customerPhone}</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-border flex items-start gap-2 text-sm text-gray-text">
                    <MapPin className="w-4 h-4 text-[#9CA3AF] shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{order.deliveryAddress}</p>
                  </div>
                </div>
              </section>

              {/* Order Items */}
              <section>
                <h3 className="text-sm font-bold text-[#9CA3AF] uppercase tracking-wider mb-4">
                  Order Items
                </h3>
                <div className="bg-background rounded-2xl p-2 border border-border">
                  {order.items.map((item, idx) => (
                    <div key={item.id} className={`p-3 flex justify-between gap-4 ${idx !== order.items.length - 1 ? 'border-b border-border' : ''}`}>
                      <div className="flex gap-3">
                        <span className="text-primary font-black bg-primary/10 px-2 py-0.5 rounded text-sm h-fit">{item.quantity}x</span>
                        <div>
                          <p className="text-foreground font-bold text-sm">{item.name}</p>
                          {item.customizations && item.customizations.length > 0 && (
                            <p className="text-xs text-[#9CA3AF] mt-1">
                              {item.customizations.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="text-foreground font-bold text-sm shrink-0">₹{item.price * item.quantity}</p>
                    </div>
                  ))}
                  {order.specialInstructions && (
                    <div className="m-3 mt-1 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                      <p className="text-xs font-bold text-yellow-500 uppercase mb-1">Special Instructions</p>
                      <p className="text-yellow-400/90 text-sm italic">"{order.specialInstructions}"</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Payment & Bill Summary */}
              <section>
                <h3 className="text-sm font-bold text-[#9CA3AF] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Bill Summary
                </h3>
                <div className="bg-background rounded-2xl p-5 border border-border space-y-3">
                  <div className="flex justify-between text-sm text-gray-text">
                    <span>Subtotal</span>
                    <span>₹{order.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-text">
                    <span>Taxes & Fees</span>
                    <span>₹{order.taxes}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-400">
                    <span>Discount</span>
                    <span>-₹{order.discount}</span>
                  </div>
                  <div className="pt-3 border-t border-border flex justify-between items-center mt-2">
                    <span className="text-foreground font-bold">Grand Total</span>
                    <span className="text-2xl font-black text-primary">₹{order.grandTotal}</span>
                  </div>
                  
                  <div className="pt-4 mt-2">
                    <div className={`px-4 py-3 rounded-xl border flex items-center justify-between font-bold text-sm ${order.paymentStatus === 'Paid' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-primary/10 border-primary/20 text-primary'}`}>
                      <span>Payment Status</span>
                      <span className="uppercase tracking-wider">{order.paymentStatus} ({order.paymentMethod})</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Delivery Partner */}
              {order.deliveryPartner && (
                <section>
                  <h3 className="text-sm font-bold text-[#9CA3AF] uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Bike className="w-4 h-4" /> Delivery Partner
                  </h3>
                  <div className="bg-background rounded-2xl p-4 border border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-section overflow-hidden border border-border flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-text" aria-label={order.deliveryPartner.name} />
                      </div>
                      <div>
                        <p className="text-foreground font-bold text-sm">{order.deliveryPartner.name}</p>
                        <p className="text-gray-text text-xs">Assigned for pickup</p>
                      </div>
                    </div>
                    <button className="w-10 h-10 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center hover:bg-green-500 hover:text-foreground transition-colors">
                      <Phone className="w-4 h-4" />
                    </button>
                  </div>
                </section>
              )}

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
