import { ContainerScroll } from './container-scroll-animation';

export function HeroScrollDemo() {
  return (
    <div className="flex flex-col overflow-hidden pb-[500px] pt-[100px]">
      <ContainerScroll
        titleComponent={
          <>
            <h1 className="text-4xl font-semibold text-black dark:text-white">
              Unleash the power of <br />
              <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none">
                Scroll Animations
              </span>
            </h1>
          </>
        }
      >
        <img
          src="https://images.unsplash.com/photo-1579353977991-54e0c2265e39?w=1400&h=720&fit=crop"
          alt="hero"
          className="mx-auto rounded-2xl object-cover h-full object-left-top w-full"
        />
      </ContainerScroll>
    </div>
  );
}
