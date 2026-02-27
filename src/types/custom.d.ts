/*
* custom.d.ts 
*
* This is a stub or way to tell the typescript compiler about modules that do not have type definitions.
* In this case, it is used to declare modules for the Swiper CSS files, which are imported in the project but do not have 
* associated type definitions. This allows the TypeScript compiler to recognize these imports without throwing errors.
*
* It is important to note that this file does not provide actual type definitions for the Swiper CSS modules; 
* it simply tells the TypeScript compiler to treat 
* them as modules without specific types. This is a common practice when working with CSS imports in TypeScript projects.
*/

declare module 'swiper/css';
declare module 'swiper/css/navigation';
declare module 'swiper/css/pagination';