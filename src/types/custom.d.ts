/*Declares TypeScript module definitions for specific Swiper CSS imports (swiper/css, swiper/css/navigation, and swiper/css/pagination). It tells the TypeScript compiler to treat these CSS paths as valid modules, preventing type errors when importing them in a TypeScript project. Since CSS files do not have built-in type definitions, these declarations allow the project to compile successfully when using Swiper styles in a TypeScript + React environment.*/

declare module "swiper/css";
declare module "swiper/css/navigation";
declare module "swiper/css/pagination";
