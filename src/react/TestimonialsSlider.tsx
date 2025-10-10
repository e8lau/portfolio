import { useEffect, useRef } from "react";
export default function TestimonialsSlider() {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        // expects Swiper from vendor bundle if you keep template JS,
        // or install swiper and import here for a module build.
        // @ts-ignore
        new Swiper(ref.current, { slidesPerView: 1, pagination: { el: ".swiper-pagination", clickable: true } });
    }, []);
    return (
        <div ref={ref} className="swiper-container page-slider">
            <div className="swiper-wrapper">
                {/* paste slides from template here */}
            </div>
            <div className="swiper-pagination" />
        </div>
    );
}
