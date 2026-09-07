"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { HeroImage } from "@/lib/memorial";

const SLIDE_MS = 5000;

export default function HeroCarousel({
  images,
  alt,
}: {
  images: HeroImage[];
  alt: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const timer = setTimeout(() => setIndex((current) => (current + 1) % images.length), SLIDE_MS);
    return () => clearTimeout(timer);
  }, [index, images.length]);

  return (
    <>
      {images.map((image, position) => (
        <Image
          key={image.id}
          src={image.imageUrl}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 28rem, 90vw"
          priority={position === 0}
          className={`object-cover object-top transition-opacity duration-1000 ${
            position === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
    </>
  );
}
