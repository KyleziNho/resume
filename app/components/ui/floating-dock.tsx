/**
 * Note: Use position fixed according to your needs
 * Desktop navbar is better positioned at the bottom
 * Mobile navbar is better positioned at bottom right.
 **/

import { cn } from "@/lib/utils";
import {
  AnimatePresence,
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import Link from "next/link";
import { useRef, useState } from "react";
import { haptic } from 'ios-haptics';

export const FloatingDock = ({
  items,
  desktopClassName,
  mobileClassName,
}: {
  items: { title: string; icon: React.ReactNode; href?: string; onClick?: () => void; isOpen?: boolean }[];
  desktopClassName?: string;
  mobileClassName?: string;
}) => {
  return (
    <>
      <FloatingDockDesktop items={items} className={desktopClassName} />
      <FloatingDockMobile items={items} className={mobileClassName} />
    </>
  );
};

const FloatingDockMobile = ({
  items,
  className,
}: {
  items: { title: string; icon: React.ReactNode; href?: string; onClick?: () => void; isOpen?: boolean }[];
  className?: string;
}) => {
  let mouseX = useMotionValue(Infinity);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [lastHoveredIndex, setLastHoveredIndex] = useState<number | null>(null);
  const [isTouching, setIsTouching] = useState(false);

  // Calculate dynamic sizing based on number of items
  const itemCount = items.length;
  const getIconSizes = () => {
    // Base sizes for 6 items or fewer
    if (itemCount <= 6) {
      return { min: 35, max: 60, gap: 2, height: 12 };
    }
    // Scale down for 7-8 items
    if (itemCount <= 8) {
      return { min: 30, max: 50, gap: 1.5, height: 11 };
    }
    // Scale down more for 9-10 items
    if (itemCount <= 10) {
      return { min: 26, max: 44, gap: 1, height: 10 };
    }
    // Maximum density for 11+ items
    return { min: 22, max: 38, gap: 0.5, height: 9 };
  };

  const { min, max, gap, height } = getIconSizes();

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsTouching(true);
    const touch = e.touches[0];
    mouseX.set(touch.pageX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isTouching) return;

    const touch = e.touches[0];
    const touchX = touch.clientX;

    // Update mouseX for magnification effect
    mouseX.set(touch.pageX);

    // Find which icon is being touched for haptic feedback
    let currentIndex = -1;
    itemRefs.current.forEach((ref, index) => {
      if (!ref) return;
      const bounds = ref.getBoundingClientRect();
      if (
        touchX >= bounds.left &&
        touchX <= bounds.right
      ) {
        currentIndex = index;
      }
    });

    // Trigger haptic if moved to a different icon
    if (currentIndex !== -1 && currentIndex !== lastHoveredIndex) {
      haptic();
      setLastHoveredIndex(currentIndex);
    }
  };

  const handleTouchEnd = () => {
    setIsTouching(false);
    setLastHoveredIndex(null);
    mouseX.set(Infinity);
  };

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className={cn(
        "mx-4 flex md:hidden items-end rounded-2xl bg-gray-50 dark:bg-neutral-900 px-3 pb-2",
        className
      )}
      style={{
        height: `${height * 4}px`,
        gap: `${gap * 4}px`
      }}
    >
      {items.map((item, index) => (
        <IconContainerMobile
          mouseX={mouseX}
          key={item.title}
          index={index}
          minSize={min}
          maxSize={max}
          isTouching={isTouching}
          itemRef={(el) => (itemRefs.current[index] = el)}
          {...item}
        />
      ))}
    </motion.div>
  );
};

const FloatingDockDesktop = ({
  items,
  className,
}: {
  items: { title: string; icon: React.ReactNode; href?: string; onClick?: () => void; isOpen?: boolean }[];
  className?: string;
}) => {
  let mouseX = useMotionValue(Infinity);
  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "mx-auto hidden md:flex h-16 gap-4 items-end rounded-2xl bg-gray-50 dark:bg-neutral-900 px-4 pb-3",
        className
      )}
    >
      {items.map((item) => (
        <IconContainer mouseX={mouseX} key={item.title} {...item} />
      ))}
    </motion.div>
  );
};

function IconContainerMobile({
  mouseX,
  title,
  icon,
  href,
  onClick,
  isOpen,
  minSize,
  maxSize,
  index,
  isTouching,
  itemRef,
}: {
  mouseX: MotionValue;
  title: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  isOpen?: boolean;
  minSize: number;
  maxSize: number;
  index: number;
  isTouching: boolean;
  itemRef?: (el: HTMLDivElement | null) => void;
}) {
  let ref = useRef<HTMLDivElement>(null);

  // Combine refs
  const setRefs = (el: HTMLDivElement | null) => {
    ref.current = el;
    if (itemRef) itemRef(el);
  };

  let distance = useTransform(mouseX, (val) => {
    let bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };

    return val - bounds.x - bounds.width / 2;
  });

  // Dynamic sizes based on item count
  let widthTransform = useTransform(distance, [-100, 0, 100], [minSize, maxSize, minSize]);
  let heightTransform = useTransform(distance, [-100, 0, 100], [minSize, maxSize, minSize]);

  let widthTransformIcon = useTransform(distance, [-100, 0, 100], [minSize, maxSize, minSize]);
  let heightTransformIcon = useTransform(
    distance,
    [-100, 0, 100],
    [minSize, maxSize, minSize]
  );

  let width = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  let height = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  let widthIcon = useSpring(widthTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  let heightIcon = useSpring(heightTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const [hovered, setHovered] = useState(false);

  // Scale dot indicator based on icon size
  const dotSize = maxSize < 45 ? 'w-0.5 h-0.5' : 'w-1 h-1';

  const handleClick = (e: React.MouseEvent) => {
    // Prevent click if currently touching/dragging
    if (isTouching) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (onClick) {
      onClick();
    }
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-0.5">
      <motion.div
        ref={setRefs}
        style={{ width, height }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="aspect-square flex items-center justify-center relative"
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 2 }}
              className="px-2 py-0.5 whitespace-pre rounded-md bg-gray-100 border dark:bg-neutral-800 dark:border-neutral-900 dark:text-white border-gray-200 text-neutral-700 absolute -top-8 w-fit text-xs text-center"
            >
              {title}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          style={{ width: widthIcon, height: heightIcon }}
          className="flex items-center justify-center"
        >
          {icon}
        </motion.div>
      </motion.div>
      {/* macOS-style dot indicator for open applications */}
      {isOpen && (
        <div className={`${dotSize} rounded-full bg-neutral-700 dark:bg-neutral-300`} />
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  if (onClick) {
    return <button onClick={handleClick}>{content}</button>;
  }

  return content;
}

function IconContainer({
  mouseX,
  title,
  icon,
  href,
  onClick,
  isOpen,
}: {
  mouseX: MotionValue;
  title: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  isOpen?: boolean;
}) {
  let ref = useRef<HTMLDivElement>(null);

  let distance = useTransform(mouseX, (val) => {
    let bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };

    return val - bounds.x - bounds.width / 2;
  });

  let widthTransform = useTransform(distance, [-150, 0, 150], [50, 100, 50]);
  let heightTransform = useTransform(distance, [-150, 0, 150], [50, 100, 50]);

  let widthTransformIcon = useTransform(distance, [-150, 0, 150], [50, 100, 50]);
  let heightTransformIcon = useTransform(
    distance,
    [-150, 0, 150],
    [50, 100, 50]
  );

  let width = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  let height = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  let widthIcon = useSpring(widthTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  let heightIcon = useSpring(heightTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const [hovered, setHovered] = useState(false);

  const content = (
    <div className="flex flex-col items-center justify-center gap-1">
      <motion.div
        ref={ref}
        style={{ width, height }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="aspect-square flex items-center justify-center relative"
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 2 }}
              className="px-2 py-0.5 whitespace-pre rounded-md bg-gray-100 border dark:bg-neutral-800 dark:border-neutral-900 dark:text-white border-gray-200 text-neutral-700 absolute -top-8 w-fit text-xs text-center"
            >
              {title}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          style={{ width: widthIcon, height: heightIcon }}
          className="flex items-center justify-center"
        >
          {icon}
        </motion.div>
      </motion.div>
      {/* macOS-style dot indicator for open applications */}
      {isOpen && (
        <div className="w-1 h-1 rounded-full bg-neutral-700 dark:bg-neutral-300" />
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  if (onClick) {
    return <button onClick={onClick}>{content}</button>;
  }

  return content;
}
