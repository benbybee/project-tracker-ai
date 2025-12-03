export const fadeIn = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
};

export const stagger = (delay = 0) => ({
  initial: 'hidden',
  animate: 'show',
  variants: {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.04,
        delayChildren: delay,
      },
    },
  },
});

export const item = {
  variants: {
    hidden: { opacity: 0, y: 6 },
    show: { opacity: 1, y: 0 },
  },
};
