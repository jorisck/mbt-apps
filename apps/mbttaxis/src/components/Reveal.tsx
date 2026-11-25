"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";

type Direction = "left" | "right" | "up" | "down" | "fade";

type Props = {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
  amount?: number;
} & Omit<HTMLMotionProps<"div">, "children">;

const offset = 56;

function initialFor(direction: Direction) {
  switch (direction) {
    case "left":
      return { opacity: 0, x: -offset };
    case "right":
      return { opacity: 0, x: offset };
    case "up":
      return { opacity: 0, y: offset };
    case "down":
      return { opacity: 0, y: -offset };
    case "fade":
    default:
      return { opacity: 0 };
  }
}

export function Reveal({
  children,
  direction = "up",
  delay = 0,
  duration = 0.65,
  className,
  once = true,
  amount = 0.2,
  ...rest
}: Props) {
  return (
    <motion.div
      className={className}
      initial={initialFor(direction)}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, amount }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

type StaggerProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
};

export function RevealStagger({
  children,
  className,
  delay = 0,
  stagger = 0.12,
}: StaggerProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      variants={{
        hidden: {},
        show: {
          transition: { staggerChildren: stagger, delayChildren: delay },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  direction = "up",
  className,
}: {
  children: ReactNode;
  direction?: Direction;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: initialFor(direction),
        show: {
          opacity: 1,
          x: 0,
          y: 0,
          transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
