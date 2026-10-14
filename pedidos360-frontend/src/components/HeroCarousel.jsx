import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";

export default function HeroCarousel() {
  const slides = [
    {
      id: 1,
      title: "COLECCIÓN PREMIUM DE RELOJES",
      subtitle: "Precisión y elegancia en cada pieza.",
      image:
        "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 2,
      title: "NUEVOS INGRESOS",
      subtitle: "Modelos exclusivos recién llegados a la tienda.",
      image:
        "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 3,
      title: "PEDIDOS360",
      subtitle: "Tu tienda de confianza para relojes de calidad.",
      image:
        "https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=1200&q=80",
    },
  ];

  return (
    <div className="w-full h-[45vh] md:h-[55vh] relative bg-black mb-16 rounded-xl overflow-hidden">
      <Swiper
        modules={[Autoplay, Pagination]}
        spaceBetween={0}
        slidesPerView={1}
        pagination={{ clickable: true }}
        autoplay={{ delay: 4000, disableOnInteraction: false }}
        loop={true}
        className="w-full h-full"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id} className="relative w-full h-full">
            <img
              src={slide.image}
              alt={slide.title}
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
              <h2 className="text-2xl md:text-4xl font-black text-white mb-3 tracking-wide drop-shadow-lg uppercase">
                {slide.title}
              </h2>
              <p className="text-gray-300 text-sm md:text-lg mb-6 max-w-xl drop-shadow-md">
                {slide.subtitle}
              </p>
              <a
                href="#catalogo"
                className="bg-[#D4AF37] text-black px-6 py-2.5 rounded-md font-bold text-sm hover:bg-white transition-colors duration-300"
              >
                Ver Catálogo
              </a>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}