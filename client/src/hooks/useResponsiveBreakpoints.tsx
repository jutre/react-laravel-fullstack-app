import { useState, useEffect } from "react";


/**
 * Function lets find out the type of device width of screen window is according to defined breakpoints (whether it refers to mobile,
 * tablet, etc). Function returns information about reached breakpoint and updates on window resize if window width reaches another
 * breakpoint.
 * 
 * Function argument is array of integers in ascending order defining browser window width breakpoints in pixels, function compares width of
 * browser window to each array element's value starting from first element and returns first array element index who's value is larger or
 * equal to window width. If all elements values are smaller than window width then value equal to array length if returned which means
 * screen width value is past all breakpoints. Thus function returned values may be interpreted similar to css media query "maxwidth"
 * chaining logic. F.e, if input array is [500, 800, 1024] and current window width is 768px then returned value is 1, if 1280px then
 * returned value is 3
 * 
 * @param  breakpoints -  array of breakpoints in ascending order, expecting at least containing one element - then it is worth start using
 * function to distinguish between two device types
 * 
 * @returns first array element whos value is larger or equal to browser window width
 */
export function useResponsiveJSX(breakpoints: [number, ...number[]]): number {
  const [index, setIndex] = useState<number>(0);

  useEffect(() => {
    const updateIndex = () => {
      const width = window.innerWidth
      let newIndex = breakpoints.findIndex((bp) => width <= bp)
      //width larger than last element in breakpoints array
      if(newIndex === -1){
        newIndex = breakpoints.length
      }
      setIndex(newIndex)
    }

    //invoke after first this custom hook's invocation as window not resized yet
    updateIndex()

    window.addEventListener('resize', updateIndex)
    return () => window.removeEventListener('resize', updateIndex)
  }, [breakpoints]);

 return index
}