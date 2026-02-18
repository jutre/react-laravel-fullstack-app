import { useEffect } from "react";


/**
 * Sets page title tag value after first component render
 * 
 */

export function useSetPageTitleTagValue(pageTitle: string) {
  useEffect(() => {
      document.title = pageTitle
    }, [])
}