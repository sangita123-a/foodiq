"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView, useSpring, useTransform } from "framer-motion";

function Counter({ from, to, duration = 2 }: { from: number, to: number, duration?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  const spring = useSpring(from, { duration: duration * 1000, bounce: 0 });
  const rounded = useTransform(spring, (latest) => Math.round(latest));

  useEffect(() => {
    if (isInView) {
      spring.set(to);
    }
  }, [isInView, spring, to]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

function DecimalCounter({ from, to }: { from: number, to: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  const spring = useSpring(from, { duration: 2000, bounce: 0 });
  const formatted = useTransform(spring, (latest) => latest.toFixed(1));

  useEffect(() => {
    if (isInView) {
      spring.set(to);
    }
  }, [isInView, spring, to]);

  return <motion.span ref={ref}>{formatted}</motion.span>;
}

export default function Achievements() {
  return (
    <div className="py-24 bg-gradient-to-br from-primary to-[#b31420] text-white">
      <div className="container mx-auto px-4 md:px-8">
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 text-center">
          
          <div>
            <div className="text-4xl md:text-6xl font-black mb-2 drop-shadow-lg">
              <Counter from={0} to={50} />K+
            </div>
            <p className="text-white/80 font-bold uppercase tracking-widest text-sm">Happy Customers</p>
          </div>

          <div>
            <div className="text-4xl md:text-6xl font-black mb-2 drop-shadow-lg">
              <Counter from={0} to={1000} duration={2.5} />+
            </div>
            <p className="text-white/80 font-bold uppercase tracking-widest text-sm">Partner Restaurants</p>
          </div>

          <div>
            <div className="text-4xl md:text-6xl font-black mb-2 drop-shadow-lg">
              <Counter from={0} to={1} />M+
            </div>
            <p className="text-white/80 font-bold uppercase tracking-widest text-sm">Orders Delivered</p>
          </div>

          <div>
            <div className="text-4xl md:text-6xl font-black mb-2 drop-shadow-lg flex items-center justify-center gap-1">
              <DecimalCounter from={0} to={4.9} />
              <span className="text-3xl md:text-5xl">★</span>
            </div>
            <p className="text-white/80 font-bold uppercase tracking-widest text-sm">Customer Rating</p>
          </div>

        </div>

      </div>
    </div>
  );
}
