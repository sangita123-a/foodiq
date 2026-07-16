"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Offer } from "./types";
import OfferCard from "./OfferCard";

interface OffersListProps {
  offers: Offer[];
  onUpdateStatus: (id: string, newStatus: Offer["status"]) => void;
  onDelete: (id: string) => void;
}

export default function OffersList({ offers, onUpdateStatus, onDelete }: OffersListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
      <AnimatePresence mode="popLayout">
        {offers.map((offer) => (
          <OfferCard 
            key={offer.id} 
            offer={offer} 
            onUpdateStatus={onUpdateStatus}
            onDelete={onDelete}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
